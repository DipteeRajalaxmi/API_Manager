package com.apimanager.portal.dto;

import lombok.Data;

@Data
public class RateLimitRequest {
    private Integer rateLimitPerMinute;  // null = disabled
    private Integer rateLimitPerHour;
    private Integer rateLimitPerDay;
    private Integer rateLimitTotal;
}