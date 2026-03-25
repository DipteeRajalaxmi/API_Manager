package com.apimanager.registry.service;

import com.apimanager.identity.entity.User;
import com.apimanager.identity.repository.UserRepository;
import com.apimanager.registry.entity.Api;
import com.apimanager.registry.entity.ApiEndpoint;
import com.apimanager.registry.repository.ApiEndpointRepository;
import com.apimanager.registry.repository.ApiRepository;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.Paths;
import io.swagger.v3.parser.OpenAPIV3Parser;
import io.swagger.v3.parser.core.models.ParseOptions;
import io.swagger.v3.parser.core.models.SwaggerParseResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApiImportService {

    private final ApiRepository         apiRepository;
    private final ApiEndpointRepository endpointRepository;
    private final UserRepository        userRepository;
    private final RestTemplate          restTemplate;

    // ── Import from raw Swagger/OpenAPI string (JSON or YAML) ─────────────────
    @Transactional
    public Map<String, Object> importFromSwagger(String content) {
        ParseOptions options = new ParseOptions();
        options.setResolve(true);
        options.setResolveFully(true);

        SwaggerParseResult result = new OpenAPIV3Parser().readContents(content, null, options);
        OpenAPI openAPI = result.getOpenAPI();

        if (openAPI == null || openAPI.getInfo() == null) {
            String messages = result.getMessages() != null ? String.join("; ", result.getMessages()) : "unknown";
            log.warn("OpenAPI parse failed: {}", messages);
            throw new IllegalArgumentException("Invalid or unreadable OpenAPI / Swagger file: " + messages);
        }

        return buildFromOpenApi(openAPI);
    }

    // ── Import from a remote URL ───────────────────────────────────────────────
    // Uses OpenAPIV3Parser.read(url) — the correct method for fetching a remote
    // spec by URL. readContents() is for raw string content, not URLs.
    @Transactional
    public Map<String, Object> importFromUrl(String url) {
        ParseOptions options = new ParseOptions();
        options.setResolve(true);
        options.setResolveFully(true);

        OpenAPI openAPI;
        try {
            // .read() fetches the URL, handles redirects, parses Swagger 2.0 + OpenAPI 3.x
            openAPI = new OpenAPIV3Parser().read(url, null, options);
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not fetch Swagger from URL: " + e.getMessage());
        }

        if (openAPI == null || openAPI.getInfo() == null) {
            throw new IllegalArgumentException(
                "Could not parse Swagger from URL. " +
                "Make sure the URL points to a valid OpenAPI 2.0 or 3.0 spec (JSON or YAML)."
            );
        }

        return buildFromOpenApi(openAPI);
    }

    // ── Preview: parse but do NOT persist ─────────────────────────────────────
    public Map<String, Object> previewFromSwagger(String content) {
        ParseOptions options = new ParseOptions();
        options.setResolve(true);
        options.setResolveFully(true);

        SwaggerParseResult result = new OpenAPIV3Parser().readContents(content, null, options);
        OpenAPI openAPI = result.getOpenAPI();

        if (openAPI == null || openAPI.getInfo() == null) {
            String messages = result.getMessages() != null ? String.join("; ", result.getMessages()) : "unknown";
            log.warn("OpenAPI parse failed: {}", messages);
            throw new IllegalArgumentException("Invalid or unreadable OpenAPI / Swagger file: " + messages);
        }

        return buildPreview(openAPI);
    }

    // ── Preview from a remote URl ───────────────────
        public Map<String, Object> previewFromUrl(String url) {
            ParseOptions options = new ParseOptions();
            options.setResolve(true);
            options.setResolveFully(true);

            OpenAPI openAPI;
            try {
                openAPI = new OpenAPIV3Parser().read(url, null, options);
            } catch (Exception e) {
                throw new IllegalArgumentException("Could not fetch Swagger from URL: " + e.getMessage());
            }

            if (openAPI == null || openAPI.getInfo() == null) {
                throw new IllegalArgumentException(
                    "Could not parse Swagger from URL. " +
                    "Make sure the URL points to a valid OpenAPI 2.0 or 3.0 spec (JSON or YAML)."
                );
            }

            return buildPreview(openAPI); 
        }

    // ── Core builder ──────────────────────────────────────────────────────────

    private Map<String, Object> buildFromOpenApi(OpenAPI openAPI) {
        // ── 1. Resolve current user (provider) ───────────────────────────────
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User provider = userRepository.findByEmail(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));

        // ── 2. Build API entity ───────────────────────────────────────────────
        String title       = openAPI.getInfo().getTitle();
        String version     = openAPI.getInfo().getVersion() != null ? openAPI.getInfo().getVersion() : "v1.0";
        String description = openAPI.getInfo().getDescription() != null ? openAPI.getInfo().getDescription() : "";
        String baseUrl     = resolveBaseUrl(openAPI);

        // Check for duplicate name + version under same org
        if (apiRepository.existsByApiNameAndVersionAndOrganization_OrgId(
                title, version, provider.getOrganization().getOrgId())) {
            throw new IllegalStateException(
                "An API named \"" + title + "\" version \"" + version + "\" already exists in your organization.");
        }

        Api api = Api.builder()
                .apiName(title)
                .version(version)
                .description(description)
                .baseUrl(baseUrl)
                .status("draft")
                .visibility("public")
                .authType("OAUTH2")
                .corsEnabled(false)
                .createdBy(provider)                        // provider_id — NOT NULL
                .organization(provider.getOrganization())   // org_id
                .build();
        api = apiRepository.save(api);

        // ── 3. Build endpoints ────────────────────────────────────────────────
        int endpointCount = 0;
        Paths paths = openAPI.getPaths();
        if (paths != null) {
            for (Map.Entry<String, PathItem> entry : paths.entrySet()) {
                endpointCount += createEndpointsForPath(api, entry.getKey(), entry.getValue());
            }
        }

        log.info("Imported API '{}' v{} — {} endpoints", title, version, endpointCount);

        return Map.of(
            "message",       "API imported successfully",
            "apiId",         api.getApiId(),
            "apiName",       api.getApiName(),
            "version",       api.getVersion(),
            "endpointCount", endpointCount
        );
    }

    private Map<String, Object> buildPreview(OpenAPI openAPI) {
        String title       = openAPI.getInfo().getTitle();
        String version     = openAPI.getInfo().getVersion() != null ? openAPI.getInfo().getVersion() : "v1.0";
        String description = openAPI.getInfo().getDescription() != null ? openAPI.getInfo().getDescription() : "";
        String baseUrl     = resolveBaseUrl(openAPI);

        List<Map<String, String>> endpoints = new ArrayList<>();
        Paths paths = openAPI.getPaths();
        if (paths != null) {
            for (Map.Entry<String, PathItem> entry : paths.entrySet()) {
                addPreviewEndpoints(endpoints, entry.getKey(), entry.getValue());
            }
        }

        return Map.of(
            "apiName",     title,
            "version",     version,
            "description", description,
            "baseUrl",     baseUrl,
            "endpoints",   endpoints
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private int createEndpointsForPath(Api api, String path, PathItem pathItem) {
        int count = 0;
        count += saveEndpoint(api, "GET",    path, pathItem.getGet());
        count += saveEndpoint(api, "POST",   path, pathItem.getPost());
        count += saveEndpoint(api, "PUT",    path, pathItem.getPut());
        count += saveEndpoint(api, "DELETE", path, pathItem.getDelete());
        count += saveEndpoint(api, "PATCH",  path, pathItem.getPatch());
        return count;
    }

    private int saveEndpoint(Api api, String method, String path, Operation operation) {
        if (operation == null) return 0;

        ApiEndpoint ep = new ApiEndpoint();
        ep.setApi(api);
        ep.setHttpMethod(method);
        ep.setPath(path);
        ep.setDescription(operation.getSummary() != null ? operation.getSummary() : "");
        ep.setIsAuthenticated(
            operation.getSecurity() != null && !operation.getSecurity().isEmpty()
        );
        endpointRepository.save(ep);
        return 1;
    }

    private void addPreviewEndpoints(List<Map<String, String>> list, String path, PathItem pathItem) {
        addPreview(list, "GET",    path, pathItem.getGet());
        addPreview(list, "POST",   path, pathItem.getPost());
        addPreview(list, "PUT",    path, pathItem.getPut());
        addPreview(list, "DELETE", path, pathItem.getDelete());
        addPreview(list, "PATCH",  path, pathItem.getPatch());
    }

    private void addPreview(List<Map<String, String>> list, String method, String path, Operation op) {
        if (op == null) return;
        list.add(Map.of(
            "method",      method,
            "path",        path,
            "description", op.getSummary() != null ? op.getSummary() : ""
        ));
    }

    private String resolveBaseUrl(OpenAPI openAPI) {
        if (openAPI.getServers() != null && !openAPI.getServers().isEmpty()) {
            String url = openAPI.getServers().get(0).getUrl();
            if (url != null && !url.isBlank() && !url.equals("/")) return url;
        }
        return "https://api.example.com";
    }
}