package com.apimanager.portal.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ApplicationResponse {
    private Long appId;
    private String appName;
    private String description;
    private String callbackUrl;
    private String status;
    private Long developerId;
    private String developerName;
    private Long orgId;
    private int subscriptionCount;
    private LocalDateTime createdAt;
}