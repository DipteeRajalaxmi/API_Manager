package com.apimanager.portal.dto;

import lombok.Data;

@Data
public class CreateApplicationRequest {
    private String appName;
    private String description;
    private String callbackUrl;
}