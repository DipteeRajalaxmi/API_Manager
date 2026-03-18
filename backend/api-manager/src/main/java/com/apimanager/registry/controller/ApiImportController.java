package com.apimanager.registry.controller;

import com.apimanager.registry.service.ApiImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/apis/swagger")
@RequiredArgsConstructor
public class ApiImportController {

    private final ApiImportService apiImportService;

    /**
     * POST /api/apis/import
     * Upload a Swagger / OpenAPI file (.json or .yaml).
     * Creates API in DRAFT + all endpoints. Returns apiId to redirect to.
     */
    @PostMapping("/import")
    public ResponseEntity<?> importFromFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (!filename.endsWith(".json") && !filename.endsWith(".yaml") && !filename.endsWith(".yml")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Only .json, .yaml, or .yml files are supported"));
        }

        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            return ResponseEntity.ok(apiImportService.importFromSwagger(content));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Import failed: " + e.getMessage()));
        }
    }

    /**
     * POST /api/apis/import-url
     * Body: { "url": "https://..." }
     * Fetches and imports a remote Swagger spec.
     */
    @PostMapping("/import-url")
    public ResponseEntity<?> importFromUrl(@RequestBody Map<String, String> body) {
        String url = body.get("url");
        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "url is required"));
        }

        try {
            return ResponseEntity.ok(apiImportService.importFromUrl(url));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Import failed: " + e.getMessage()));
        }
    }

    /**
     * POST /api/apis/import/preview
     * Upload a file and get a parsed preview WITHOUT saving anything.
     * Used by the frontend "preview before import" flow.
     */
    @PostMapping("/import/preview")
    public ResponseEntity<?> previewFromFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            return ResponseEntity.ok(apiImportService.previewFromSwagger(content));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Preview failed: " + e.getMessage()));
        }
    }
}