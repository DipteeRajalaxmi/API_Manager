package com.apimanager.gateway.config;

import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.web.client.RestTemplate;

@Configuration
public class GatewayConfig {

    @Bean
    public RestTemplate restTemplate() {
        // HttpComponents supports ALL methods including PATCH
        CloseableHttpClient httpClient = HttpClients.createDefault();
        HttpComponentsClientHttpRequestFactory factory =
            new HttpComponentsClientHttpRequestFactory(httpClient);

        RestTemplate restTemplate = new RestTemplate(factory);

        // byte[] converter for binary responses
        restTemplate.getMessageConverters().add(
            0, new ByteArrayHttpMessageConverter()
        );

        // remove Accept-Encoding so upstream sends plain text
        restTemplate.getInterceptors().add((request, body, execution) -> {
            request.getHeaders().remove("Accept-Encoding");
            return execution.execute(request, body);
        });

        return restTemplate;
    }
}