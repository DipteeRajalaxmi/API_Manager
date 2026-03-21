package com.apimanager.registry.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder

public class ApiResponse {
    private Long apiId;
    private String apiName;
    private String version;
    private String description;
    private String status;
    private String baseUrl;
    private String visibility;
    private String categoryName;
    // private Long orgId;
    // private String orgName;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ApiEndpointResponse> endpoints;
    private Long rateLimitPerMinute;
    private Long rateLimitPerHour;
    private Long rateLimitPerDay;
    private Long rateLimitTotal;
    private Boolean isBlocked;
    private String  blockedReason;
 
    
}
