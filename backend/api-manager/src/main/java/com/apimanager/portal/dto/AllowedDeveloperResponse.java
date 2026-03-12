package com.apimanager.portal.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AllowedDeveloperResponse {
    private Long userId;
    private String name;
    private String email;
    private LocalDateTime addedAt;
}