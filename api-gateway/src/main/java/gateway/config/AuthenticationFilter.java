package gateway.config;

import gateway.dto.response.ApiResponse;
import gateway.service.IdentityService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.*;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import tools.jackson.databind.ObjectMapper;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationFilter implements GlobalFilter, Ordered {

    IdentityService identityService;
    ObjectMapper objectMapper;

    @NonFinal
    private String[] publicEndpoints = {
            "/auth/register",
            "/auth/login",
            "/auth/introspect",
            "/auth/refresh",
            "/profile/internal/users"
    };

    @Value("${app.api-prefix}")
    @NonFinal
    private String prefix;

    @Override
    public Mono<Void> filter(
            ServerWebExchange exchange,
            GatewayFilterChain chain
    ) {

        // Endpoint không cần xác thực
        if (isPublicEndpoint(exchange.getRequest())) {
            return chain.filter(exchange);
        }

        String token = getToken(exchange.getRequest());

        // Không tìm thấy JWT
        if (token == null || token.isBlank()) {
            return unauthenticated(exchange.getResponse());
        }

        return identityService.introspect(token)
                .flatMap(introspectResponse -> {

                    if (introspectResponse.getResult().isValid()) {

                        /*
                         * Forward JWT xuống service phía sau Gateway.
                         *
                         * Điều này hữu ích nếu Auth Service/User Service
                         * vẫn đang đọc JWT từ Authorization header.
                         */
                        ServerHttpRequest request = exchange
                                .getRequest()
                                .mutate()
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                                .build();

                        return chain.filter(
                                exchange.mutate()
                                        .request(request)
                                        .build()
                        );
                    }

                    return unauthenticated(exchange.getResponse());
                })
                .onErrorResume(
                        throwable ->
                                unauthenticated(exchange.getResponse())
                );
    }

    /**
     * Lấy JWT.
     *
     * Ưu tiên Authorization header.
     * Nếu không có thì lấy accessToken từ HttpOnly Cookie.
     */
    private String getToken(ServerHttpRequest request) {

        // 1. Authorization header
        List<String> authHeaders = request
                .getHeaders()
                .get(HttpHeaders.AUTHORIZATION);

        if (!CollectionUtils.isEmpty(authHeaders)) {

            String authorization = authHeaders.getFirst();

            if (authorization != null
                    && authorization.startsWith("Bearer ")) {

                return authorization.substring(7);
            }
        }

        // 2. HttpOnly Cookie
        if (request.getCookies().containsKey("accessToken")) {

            HttpCookie cookie =
                    request.getCookies()
                            .getFirst("accessToken");

            if (cookie != null) {
                return cookie.getValue();
            }
        }

        return null;
    }

    private boolean isPublicEndpoint(ServerHttpRequest request) {

        String path = request.getURI().getPath();

        return Arrays.stream(publicEndpoints)
                .anyMatch(uri ->
                        path.matches(prefix + uri)
                );
    }

    @Override
    public int getOrder() {
        return 0;
    }

    private Mono<Void> unauthenticated(
            ServerHttpResponse response
    ) {

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(1008)
                .message("unauthenticated")
                .build();

        String body = objectMapper.writeValueAsString(apiResponse);

        response.setStatusCode(HttpStatus.UNAUTHORIZED);

        response.getHeaders().set(
                HttpHeaders.CONTENT_TYPE,
                MediaType.APPLICATION_JSON_VALUE
        );

        return response.writeWith(
                Mono.just(
                        response.bufferFactory()
                                .wrap(body.getBytes())
                )
        );
    }
}