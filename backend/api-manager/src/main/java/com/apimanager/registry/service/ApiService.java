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
import com.apimanager.registry.entity.ApiDocument;
import com.apimanager.registry.repository.ApiDocumentRepository;
import com.apimanager.identity.entity.Organization;


import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApiService {

    private final ApiRepository apiRepository;
    private final ApiEndpointRepository apiEndpointRepository;
    private final ApiCategoryRepository apiCategoryRepository;
    private final UserRepository userRepository;
    private final ApiDocumentRepository apiDocumentRepository;

    

    public ApiResponse createApi(ApiRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Organization org = user.getOrganization();
        if (org == null) throw new RuntimeException("User has no organization");

        if (apiRepository.existsByApiNameAndVersionAndOrganization_OrgId(
                request.getApiName(), request.getVersion(), org.getOrgId())) {
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
                .organization(org)   
                .createdBy(user)  
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

    public ApiResponse updateApi(Long apiId, ApiRequest request){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        Api api = getApiEntity(apiId);

        if(!api.getCreatedBy().getEmail().equals(email)){
            throw new RuntimeException("Not authorized to modify this api");
        }

        if(api.getStatus().equals("retired")){
            throw new RuntimeException("Retired api's cannot be update");
        }

        if (request.getApiName() != null) api.setApiName(request.getApiName());
        if (request.getDescription() != null) api.setDescription(request.getDescription());
        if (request.getBaseUrl() != null) api.setBaseUrl(request.getBaseUrl());
        if (request.getVisibility() != null) api.setVisibility(request.getVisibility());

        if (request.getCategoryId() != null) {
            ApiCategory category = apiCategoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            api.setCategory(category);
        }

        return mapToResponse(apiRepository.save(api));
    }


    public ApiResponse createNewVersion(Long apiId, String newVersion){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Api existingApi  = getApiEntity(apiId);

        if (!existingApi.getCreatedBy().getEmail().equals(email)) {
            throw new RuntimeException("Not authorized");
        }

        if (apiRepository.existsByApiNameAndVersionAndOrganization_OrgId(
                existingApi.getApiName(), newVersion, existingApi.getOrganization().getOrgId())) {
            throw new RuntimeException("Version " + newVersion + " already exists for this API");
        }


        Api newApi = Api.builder()
            .apiName(existingApi.getApiName())
            .version(newVersion)
            .description(existingApi.getDescription())
            .baseUrl(existingApi.getBaseUrl())
            .visibility(existingApi.getVisibility())
            .status("draft")
            .category(existingApi.getCategory())
            .organization(existingApi.getOrganization())
            .createdBy(existingApi.getCreatedBy())
            .build();

        return mapToResponse(apiRepository.save(newApi));
    }

    public List<ApiResponse> getApiVersions(Long apiId) {
        Api api = getApiEntity(apiId);
        return apiRepository.findByOrganization_OrgId(api.getOrganization().getOrgId())
                .stream()
                .filter(a -> a.getApiName().equals(api.getApiName()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ApiDocumentResponse addDocument(Long apiId, ApiDocumentRequest request){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Api api = getApiEntity(apiId);

        if(!api.getCreatedBy().getEmail().equals(email)){
            throw new RuntimeException("Not authorized");
        }

        ApiDocument doc = ApiDocument.builder()
            .api(api)
            .title(request.getTitle())
            .docType(request.getDocType())
            .contentText(request.getContentText())
            .contentUrl(request.getContentUrl())
            .build();


        ApiDocument saved = apiDocumentRepository.save(doc);
        return mapDocToResponse(saved);

    }

    public List<ApiDocumentResponse> getDocuments(Long apiId){
        return apiDocumentRepository.findByApi_ApiId(apiId)
            .stream().map(this::mapDocToResponse).collect(Collectors.toList());
    }

    public void deleteDocument(Long docId) {
        apiDocumentRepository.deleteById(docId);
    }

    private ApiDocumentResponse mapDocToResponse(ApiDocument doc) {
        return ApiDocumentResponse.builder()
                .docId(doc.getDocId())
                .title(doc.getTitle())
                .docType(doc.getDocType())
                .contentText(doc.getContentText())
                .contentUrl(doc.getContentUrl())
                .createdAt(doc.getCreatedAt())
                .build();
    }


    public void deleteApi(Long apiId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Api api = getApiEntity(apiId);
        if (!api.getCreatedBy().getEmail().equals(email)) {
            throw new RuntimeException("Not authorized");
        }
        if (api.getStatus().equals("published")) {
            throw new RuntimeException("Cannot delete a published API. Deprecate it first.");
        }
        apiRepository.deleteById(apiId);
    }

    public ApiEndpointResponse updateEndpoint(Long endpointId, ApiEndpointRequest request) {
        ApiEndpoint endpoint = apiEndpointRepository.findById(endpointId)
                .orElseThrow(() -> new RuntimeException("Endpoint not found"));

        if (request.getHttpMethod() != null) endpoint.setHttpMethod(request.getHttpMethod().toUpperCase());
        if (request.getPath() != null) endpoint.setPath(request.getPath());
        if (request.getDescription() != null) endpoint.setDescription(request.getDescription());
        if (request.getRequestSchema() != null) endpoint.setRequestSchema(request.getRequestSchema());
        if (request.getResponseSchema() != null) endpoint.setResponseSchema(request.getResponseSchema());
        if (request.getIsAuthenticated() != null) endpoint.setIsAuthenticated(request.getIsAuthenticated());

        return mapEndpointToResponse(apiEndpointRepository.save(endpoint));
    }

    public List<?> getCategories() {
        return apiCategoryRepository.findAll();
    }

    public List<ApiResponse> searchPublishedApis(String search, Long categoryId, Long orgId) {
        return apiRepository.searchPublishedApis(search, categoryId, orgId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
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