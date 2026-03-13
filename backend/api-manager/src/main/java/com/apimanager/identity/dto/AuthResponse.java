package com.apimanager.identity.dto;


import lombok.AllArgsConstructor;
import  lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class AuthResponse {
    private String token;
    private String refreshToken;
    private String email;
    private String name;
    private String role;
    private Long userId;
    private Long orgId;
    private String orgName;
    private String inviteCode;  // returned only on provider registration
     
}
