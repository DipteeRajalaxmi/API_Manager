package com.apimanager.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class GatewayConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        RestTemplate restTemplate = new RestTemplate(factory);

        // Remove Accept-Encoding so upstream sends plain text instead of gzip
        restTemplate.getInterceptors().add((request, body, execution) -> {
            request.getHeaders().remove("Accept-Encoding");
            return execution.execute(request, body);
        });

        return restTemplate;
    }
}