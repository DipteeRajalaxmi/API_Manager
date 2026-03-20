package com.apimanager.registry.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ApiEndpointRequest {
    @NotBlank(message = "HTTP method is required")
    private String httpMethod;

    @NotBlank(message = "Path is required")
    private String path;

    private String description;
    private String requestSchema;
    private String responseSchema;
    private Boolean isAuthenticated;
    private Long rateLimitPerMinute;
    private Long rateLimitPerHour;
    private Long rateLimitPerDay;
}
