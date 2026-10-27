package gateway.config;

import gateway.repository.IdentityClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.support.WebClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

import java.util.List;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .baseUrl("http://localhost:8081")
                .build();
    }

    @Bean
    public CorsWebFilter corsWebFilter() {

        CorsConfiguration corsConfiguration =
                new CorsConfiguration();

        // React frontend
        corsConfiguration.setAllowedOrigins(
                List.of("http://localhost:3000")
        );

        corsConfiguration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );

        corsConfiguration.setAllowedHeaders(
                List.of("*")
        );

        // Cho phép gửi Cookie
        corsConfiguration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                corsConfiguration
        );

        return new CorsWebFilter(source);
    }

    @Bean
    public IdentityClient identityClient() {

        HttpServiceProxyFactory factory =
                HttpServiceProxyFactory
                        .builderFor(
                                WebClientAdapter.create(webClient())
                        )
                        .build();

        return factory.createClient(
                IdentityClient.class
        );
    }
}