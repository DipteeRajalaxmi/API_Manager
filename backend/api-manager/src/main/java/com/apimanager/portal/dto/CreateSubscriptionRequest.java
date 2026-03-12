package com.apimanager.portal.dto;

import lombok.Data;

@Data
public class CreateSubscriptionRequest {
    private Long appId;
    private Long apiId;
}