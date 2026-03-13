package com.apimanager.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class UserResponse {
    private Long userId;
    private String email;
    private String name;
    private String role;
    private String status;
    private Long orgId;
    private String orgName;
    private String orgDomain;
    private String inviteCode;  // only populated for API_PROVIDER
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
}
