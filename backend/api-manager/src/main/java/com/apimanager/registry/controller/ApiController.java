package com.apimanager.registry.controller;

import com.apimanager.registry.dto.*;
import com.apimanager.registry.service.ApiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/apis")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")

public class ApiController {
    private final ApiService apiService;

    @PostMapping
    public ResponseEntity<ApiResponse> createApi(@Valid @RequestBody ApiRequest request) {
        return ResponseEntity.ok(apiService.createApi(request));
    }

    @GetMapping
    public ResponseEntity<List<ApiResponse>> getAllPublishedApis() {
        return ResponseEntity.ok(apiService.getAllPublishedApis());
    }

    @GetMapping("/my")
    public ResponseEntity<List<ApiResponse>> getMyApis() {
        return ResponseEntity.ok(apiService.getMyApis());
    }

    @GetMapping("/{apiId}")
    public ResponseEntity<ApiResponse> getApiById(@PathVariable Long apiId) {
        return ResponseEntity.ok(apiService.getApiById(apiId));
    }

    @PatchMapping("/{apiId}/publish")
    public ResponseEntity<ApiResponse> publishApi(@PathVariable Long apiId) {
        return ResponseEntity.ok(apiService.publishApi(apiId));
    }

    @PatchMapping("/{apiId}/deprecate")
    public ResponseEntity<ApiResponse> deprecateApi(@PathVariable Long apiId) {
        return ResponseEntity.ok(apiService.deprecateApi(apiId));
    }

    @PostMapping("/{apiId}/endpoints")
    public ResponseEntity<ApiEndpointResponse> addEndpoint(
            @PathVariable Long apiId,
            @Valid @RequestBody ApiEndpointRequest request) {
        return ResponseEntity.ok(apiService.addEndpoint(apiId, request));
    }

    @GetMapping("/{apiId}/endpoints")
    public ResponseEntity<List<ApiEndpointResponse>> getEndpoints(@PathVariable Long apiId) {
        return ResponseEntity.ok(apiService.getEndpoints(apiId));
    }

    @DeleteMapping("/endpoints/{endpointId}")
    public ResponseEntity<Void> deleteEndpoint(@PathVariable Long endpointId) {
        apiService.deleteEndpoint(endpointId);
        return ResponseEntity.noContent().build();
    }
    @PatchMapping("/{apiId}/retire")
    public ResponseEntity<ApiResponse> retireApi(@PathVariable Long apiId) {
        return ResponseEntity.ok(apiService.retireApi(apiId));
    }
    
}
