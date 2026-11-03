package submission.config;

import feign.RequestInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class ExecutionFeignConfig {

    @Bean
    public RequestInterceptor authorizationRequestInterceptor() {
        return requestTemplate -> {
            var attributes = RequestContextHolder.getRequestAttributes();

            if (!(attributes instanceof ServletRequestAttributes servletAttributes)) {
                return;
            }

            HttpServletRequest request = servletAttributes.getRequest();

            String authorization =
                    request.getHeader(HttpHeaders.AUTHORIZATION);

            if (StringUtils.hasText(authorization)) {
                requestTemplate.header(
                        HttpHeaders.AUTHORIZATION,
                        authorization
                );
            }
        };
    }
}