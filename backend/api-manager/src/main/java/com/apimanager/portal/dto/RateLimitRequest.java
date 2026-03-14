package com.apimanager.portal.dto;

import lombok.Data;

@Data
public class RateLimitRequest {
    private Long rateLimitPerMinute;  // null = disabled
    private Long rateLimitPerHour;
    private Long rateLimitPerDay;
    private Long rateLimitTotal;
}