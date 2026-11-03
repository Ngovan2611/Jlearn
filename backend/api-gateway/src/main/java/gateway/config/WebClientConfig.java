package gateway.config;

import gateway.repository.IdentityClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.support.WebClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .baseUrl("http://localhost:8081")
                .build();
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