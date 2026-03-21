package com.apimanager.registry.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data

public class ApiDocumentRequest {
    @NotBlank(message="Title is required ")
    private String title;

    private String docType;
    // private String content;
    private String contentUrl;
    private String contentText;
    
}
