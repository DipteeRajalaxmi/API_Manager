package com.apimanager.registry.service;

import com.apimanager.identity.entity.User;
import com.apimanager.identity.repository.UserRepository;
import com.apimanager.registry.dto.*;
import com.apimanager.registry.entity.Api;
import com.apimanager.registry.entity.ApiCategory;
import com.apimanager.registry.entity.ApiEndpoint;
import com.apimanager.registry.repository.ApiCategoryRepository;
import com.apimanager.registry.repository.ApiEndpointRepository;
import com.apimanager.registry.repository.ApiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApiService {

    private final ApiRepository apiRepository;
    private final ApiEndpointRepository apiEndpointRepository;
    private final ApiCategoryRepository apiCategoryRepository;
    private final UserRepository userRepository;
    // REMOVED: OrganizationRepository — not needed anymore

    public ApiResponse createApi(ApiRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (apiRepository.existsByApiNameAndVersion(
                request.getApiName(), request.getVersion())) {
            throw new RuntimeException("API with this name and version already exists");
        }

        ApiCategory category = null;
        if (request.getCategoryId() != null) {
            category = apiCategoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        Api api = Api.builder()
                .apiName(request.getApiName())
                .version(request.getVersion())
                .description(request.getDescription())
                .baseUrl(request.getBaseUrl())
                .visibility(request.getVisibility() != null ? request.getVisibility() : "public")
                .status("draft")
                .category(category)
                .createdBy(user)  // REMOVED: .organization(org)
                .build();

        return mapToResponse(apiRepository.save(api));
    }

    public ApiResponse publishApi(Long apiId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Api api = getApiEntity(apiId);

        if (!api.getCreatedBy().getEmail().equals(email)) {
            throw new RuntimeException("Not authorized to modify this API");
        }
        if (!api.getStatus().equals("draft")) {
            throw new RuntimeException("Only DRAFT apis can be published");
        }
        api.setStatus("published");
        return mapToResponse(apiRepository.save(api));
    }

    public ApiResponse deprecateApi(Long apiId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Api api = getApiEntity(apiId);

        if (!api.getCreatedBy().getEmail().equals(email)) {
            throw new RuntimeException("Not authorized to modify this API");
        }
        if (!api.getStatus().equals("published")) {
            throw new RuntimeException("Only PUBLISHED apis can be deprecated");
        }
        api.setStatus("deprecated");
        return mapToResponse(apiRepository.save(api));
    }

    public ApiResponse retireApi(Long apiId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Api api = getApiEntity(apiId);

        if (!api.getCreatedBy().getEmail().equals(email)) {
            throw new RuntimeException("Not authorized to modify this API");
        }
        if (!api.getStatus().equals("deprecated")) {
            throw new RuntimeException("Only DEPRECATED apis can be retired");
        }
        api.setStatus("retired");
        return mapToResponse(apiRepository.save(api));
    }

    public ApiResponse getApiById(Long apiId) {
        return mapToResponse(getApiEntity(apiId));
    }

    public List<ApiResponse> getAllPublishedApis() {
        return apiRepository.findByStatus("published")
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<ApiResponse> getMyApis() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return apiRepository.findByCreatedBy_UserId(user.getUserId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public ApiEndpointResponse addEndpoint(Long apiId, ApiEndpointRequest request) {
        Api api = getApiEntity(apiId);

        ApiEndpoint endpoint = ApiEndpoint.builder()
                .api(api)
                .httpMethod(request.getHttpMethod().toUpperCase())
                .path(request.getPath())
                .description(request.getDescription())
                .requestSchema(request.getRequestSchema())
                .responseSchema(request.getResponseSchema())
                .isAuthenticated(request.getIsAuthenticated() != null ? request.getIsAuthenticated() : true)
                .build();

        return mapEndpointToResponse(apiEndpointRepository.save(endpoint));
    }

    public List<ApiEndpointResponse> getEndpoints(Long apiId) {
        return apiEndpointRepository.findByApi_ApiId(apiId)
                .stream().map(this::mapEndpointToResponse).collect(Collectors.toList());
    }

    public void deleteEndpoint(Long endpointId) {
        apiEndpointRepository.deleteById(endpointId);
    }

    private Api getApiEntity(Long apiId) {
        return apiRepository.findById(apiId)
                .orElseThrow(() -> new RuntimeException("API not found: " + apiId));
    }

    private ApiResponse mapToResponse(Api api) {
        return ApiResponse.builder()
                .apiId(api.getApiId())
                .apiName(api.getApiName())
                .version(api.getVersion())
                .description(api.getDescription())
                .status(api.getStatus())
                .baseUrl(api.getBaseUrl())
                .visibility(api.getVisibility())
                .categoryName(api.getCategory() != null ? api.getCategory().getCategoryName() : null)
                // REMOVED: orgId and orgName — no organization in Api
                .createdById(api.getCreatedBy() != null ? api.getCreatedBy().getUserId() : null)
                .createdByName(api.getCreatedBy() != null ? api.getCreatedBy().getName() : null)
                .createdAt(api.getCreatedAt())
                .updatedAt(api.getUpdatedAt())
                .endpoints(api.getEndpoints() != null ?
                        api.getEndpoints().stream().map(this::mapEndpointToResponse).collect(Collectors.toList())
                        : null)
                .build();
    }

    private ApiEndpointResponse mapEndpointToResponse(ApiEndpoint endpoint) {
        return ApiEndpointResponse.builder()
                .endpointId(endpoint.getEndpointId())
                .httpMethod(endpoint.getHttpMethod())
                .path(endpoint.getPath())
                .description(endpoint.getDescription())
                .requestSchema(endpoint.getRequestSchema())
                .responseSchema(endpoint.getResponseSchema())
                .isAuthenticated(endpoint.getIsAuthenticated())
                .build();
    }
}