package com.apimanager.portal.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ApiKeyResponse {
    private Long keyId;
    private String clientId;

    // rawKey is ONLY populated on creation or regeneration — null on all other fetches
    // Developer must save it immediately — we never show it again
    private String rawKey;

    private String keyType;   // PRODUCTION | SANDBOX
    private String status;    // active | revoked | expired
    private Long subscriptionId;
    private String apiName;
    private String appName;
    private LocalDateTime createdAt;
    private LocalDateTime lastUsedAt;
}