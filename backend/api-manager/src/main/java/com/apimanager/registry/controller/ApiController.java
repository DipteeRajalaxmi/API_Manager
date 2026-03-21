package com.apimanager.registry.controller;

import com.apimanager.registry.dto.*;
import com.apimanager.registry.service.ApiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/apis")
@RequiredArgsConstructor
public class ApiController {

    private final ApiService apiService;

    @PostMapping
    public ResponseEntity<ApiResponse> createApi(@Valid @RequestBody ApiRequest request) {
        return ResponseEntity.ok(apiService.createApi(request));
    }

    @GetMapping
    public ResponseEntity<List<ApiResponse>> searchApis(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(apiService.searchPublishedApis(search, categoryId, null));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ApiResponse>> getMyApis() {
        return ResponseEntity.ok(apiService.getMyApis());
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        return ResponseEntity.ok(apiService.getCategories());
    }

    @GetMapping("/{apiId}")
    public ResponseEntity<ApiResponse> getApiById(@PathVariable Long apiId) {
        return ResponseEntity.ok(apiService.getApiById(apiId));
    }

    @PutMapping("/{apiId}")
    public ResponseEntity<ApiResponse> updateApi(
            @PathVariable Long apiId,
            @RequestBody ApiRequest request) {
        return ResponseEntity.ok(apiService.updateApi(apiId, request));
    }

    @DeleteMapping("/{apiId}")
    public ResponseEntity<Void> deleteApi(@PathVariable Long apiId) {
        apiService.deleteApi(apiId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{apiId}/publish")
    public ResponseEntity<ApiResponse> publishApi(@PathVariable Long apiId) {
        return ResponseEntity.ok(apiService.publishApi(apiId));
    }

    @PatchMapping("/{apiId}/deprecate")
    public ResponseEntity<ApiResponse> deprecateApi(@PathVariable Long apiId) {
        return ResponseEntity.ok(apiService.deprecateApi(apiId));
    }

    @PatchMapping("/{apiId}/retire")
    public ResponseEntity<ApiResponse> retireApi(@PathVariable Long apiId) {
        return ResponseEntity.ok(apiService.retireApi(apiId));
    }

    @PostMapping("/{apiId}/versions")
    public ResponseEntity<ApiResponse> createNewVersion(
            @PathVariable Long apiId,
            @RequestParam String version) {
        return ResponseEntity.ok(apiService.createNewVersion(apiId, version));
    }

    @GetMapping("/{apiId}/versions")
    public ResponseEntity<List<ApiResponse>> getVersions(@PathVariable Long apiId) {
        return ResponseEntity.ok(apiService.getApiVersions(apiId));
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

    @PutMapping("/{apiId}/endpoints/{endpointId}")
    public ResponseEntity<ApiEndpointResponse> updateEndpoint(
            @PathVariable Long apiId,
            @PathVariable Long endpointId,
            @RequestBody ApiEndpointRequest request) {
        return ResponseEntity.ok(apiService.updateEndpoint(endpointId, request));
    }

    @DeleteMapping("/endpoints/{endpointId}")
    public ResponseEntity<Void> deleteEndpoint(@PathVariable Long endpointId) {
        apiService.deleteEndpoint(endpointId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{apiId}/documents")
    public ResponseEntity<ApiDocumentResponse> addDocument(
            @PathVariable Long apiId,
            @Valid @RequestBody ApiDocumentRequest request) {
        return ResponseEntity.ok(apiService.addDocument(apiId, request));
    }

    @GetMapping("/{apiId}/documents")
    public ResponseEntity<List<ApiDocumentResponse>> getDocuments(@PathVariable Long apiId) {
        return ResponseEntity.ok(apiService.getDocuments(apiId));
    }

    @DeleteMapping("/documents/{docId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long docId) {
        apiService.deleteDocument(docId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/endpoints/{endpointId}")
    public ResponseEntity<ApiEndpointResponse> updateEndpointDirect(
            @PathVariable Long endpointId,
            @RequestBody ApiEndpointRequest request) {
        return ResponseEntity.ok(apiService.updateEndpoint(endpointId, request));
    }

    // Block/unblock API
        @PatchMapping("/{apiId}/block")
        public ResponseEntity<ApiResponse> blockApi(
                @PathVariable Long apiId,
                @RequestBody(required = false) Map<String, String> body) {
            return ResponseEntity.ok(apiService.blockApi(apiId,
                    body != null ? body.get("reason") : null));
        }

        @PatchMapping("/{apiId}/unblock")
        public ResponseEntity<ApiResponse> unblockApi(@PathVariable Long apiId) {
            return ResponseEntity.ok(apiService.unblockApi(apiId));
        }

        // Block/unblock endpoint
        @PatchMapping("/endpoints/{endpointId}/block")
        public ResponseEntity<ApiEndpointResponse> blockEndpoint(
                @PathVariable Long endpointId,
                @RequestBody(required = false) Map<String, String> body) {
            return ResponseEntity.ok(apiService.blockEndpoint(endpointId,
                    body != null ? body.get("reason") : null));
        }

        @PatchMapping("/endpoints/{endpointId}/unblock")
        public ResponseEntity<ApiEndpointResponse> unblockEndpoint(@PathVariable Long endpointId) {
            return ResponseEntity.ok(apiService.unblockEndpoint(endpointId));
        }
}