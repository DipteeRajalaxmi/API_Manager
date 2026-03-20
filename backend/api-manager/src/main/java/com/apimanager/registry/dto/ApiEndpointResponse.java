package com.apimanager.registry.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder

public class ApiEndpointResponse {
    private Long endpointId;
    private String httpMethod;
    private String path;
    private String description;
    private String requestSchema;
    private String responseSchema;
    private Boolean isAuthenticated;
    private Long rateLimitPerMinute;
    private Long rateLimitPerHour;
    private Long rateLimitPerDay;
    
}
