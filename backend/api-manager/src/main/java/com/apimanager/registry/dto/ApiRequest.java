package com.apimanager.registry.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ApiRequest {

    @NotBlank(message = "API Name is required")
    private String apiName;

    private String version;
    private String description;

    @NotBlank(message = "Base URL is required")
    private String baseUrl;

    private String visibility; 
    private String authType;   
    private Long categoryId;
}