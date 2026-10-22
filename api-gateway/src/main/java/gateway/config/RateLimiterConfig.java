package gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.reactive.ServerHttpRequest;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.util.Optional;

@Configuration
public class RateLimiterConfig {

    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            ServerHttpRequest request = exchange.getRequest();

            // Đọc IP từ Header X-Forwarded-For nếu qua Proxy/Nginx/Cloudflare
            String xForwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return Mono.just(xForwardedFor.split(",")[0].trim());
            }

            // Fallback lấy IP trực tiếp kết nối tới Gateway
            String remoteAddress = Optional.ofNullable(request.getRemoteAddress())
                    .map(InetSocketAddress::getHostString)
                    .orElse("unknown-ip");

            return Mono.just(remoteAddress);
        };
    }
}