package com.apimanager.portal.dto;

import lombok.Data;

@Data
public class GrantAccessRequest {
    private Long developerId;
    private Long apiId;
}