package com.apimanager.portal.dto;

import lombok.Data;
import java.util.List;

@Data
public class GrantAccessRequest {
    private Long developerId;
    private Long apiId;
    private List<Long> endpointIds;
}