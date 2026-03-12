package com.apimanager.portal.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SubscriptionResponse {
    private Long subscriptionId;
    private Long appId;
    private String appName;
    private Long apiId;
    private String apiName;
    private String apiVersion;
    private String apiBaseUrl;
    private String status;

    // API key client_id — shown to developer (NOT the raw secret)
    private String clientId;

    private LocalDateTime subscribedAt;

    // Rate limits defined by provider on this API (null = that limit not set)
    private Integer rateLimitPerMinute;
    private Integer rateLimitPerHour;
    private Integer rateLimitPerDay;
    private Integer rateLimitTotal;

    // Current usage counters (populated on fetch)
    private Long usedPerMinute;
    private Long usedPerHour;
    private Long usedPerDay;
    private Long usedTotal;
}