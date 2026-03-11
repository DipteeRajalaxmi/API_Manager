package com.apimanager.registry.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Builder
@Data

public class ApiDocumentResponse {
    private Long docId;
    private String title;
    private String docType;
    // private String content;
    private String contentUrl;
    private String contentText;
    private LocalDateTime createdAt;
    
}
