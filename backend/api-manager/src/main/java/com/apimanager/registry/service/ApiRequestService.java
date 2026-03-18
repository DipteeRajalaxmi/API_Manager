package com.apimanager.registry.service;

import com.apimanager.common.exception.ApiManagerException;
import com.apimanager.identity.entity.Organization;
import com.apimanager.identity.entity.User;
import com.apimanager.identity.repository.UserRepository;
import com.apimanager.registry.entity.Api;
import com.apimanager.registry.entity.ApiCategory;
import com.apimanager.registry.entity.ApiEndpoint;
import com.apimanager.registry.entity.ApiRequest;
import com.apimanager.registry.repository.ApiCategoryRepository;
import com.apimanager.registry.repository.ApiEndpointRepository;
import com.apimanager.registry.repository.ApiRepository;
import com.apimanager.registry.repository.ApiRequestRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApiRequestService {

    private final ApiRequestRepository requestRepo;
    private final ApiRepository        apiRepo;
    private final ApiEndpointRepository endpointRepo;
    private final ApiCategoryRepository categoryRepo;
    private final UserRepository        userRepo;
    private final ObjectMapper          objectMapper;

    // ── Developer: submit API request ─────────────────────────────────────────
    @Transactional
    public Map<String, Object> submitRequest(Map<String, Object> body) {
        User developer = currentUser();

        Organization org = developer.getOrganization();
        if (org == null)
            throw new ApiManagerException("You must belong to an organization to submit API requests");

        // validate required fields
        String apiName = (String) body.get("apiName");
        String baseUrl = (String) body.get("baseUrl");
        if (apiName == null || apiName.isBlank())
            throw new ApiManagerException("API name is required");
        if (baseUrl == null || baseUrl.isBlank())
            throw new ApiManagerException("Base URL is required");

        // serialize endpoints to JSON
        String endpointsJson = null;
        if (body.get("endpoints") != null) {
            try {
                endpointsJson = objectMapper.writeValueAsString(body.get("endpoints"));
            } catch (Exception e) {
                log.warn("Failed to serialize endpoints: {}", e.getMessage());
            }
        }

        // optional category
        ApiCategory category = null;
        if (body.get("categoryId") != null) {
            Long catId = Long.valueOf(body.get("categoryId").toString());
            category = categoryRepo.findById(catId).orElse(null);
        }

        ApiRequest req = ApiRequest.builder()
                .organization(org)
                .submittedBy(developer)
                .apiName(apiName)
                .description((String) body.get("description"))
                .baseUrl(baseUrl)
                .visibility(body.get("visibility") != null ? (String) body.get("visibility") : "private")
                .category(category)
                .endpoints(endpointsJson)
                .status("pending")
                .build();

        ApiRequest saved = requestRepo.save(req);
        return toMap(saved);
    }

    // ── Developer: get their requests ──────────────────────────────────────────
    public List<Map<String, Object>> getMyRequests() {
        User developer = currentUser();
        return requestRepo.findBySubmittedBy_UserIdOrderBySubmittedAtDesc(developer.getUserId())
                .stream().map(this::toMap).toList();
    }

    // ── Provider: get all org requests ────────────────────────────────────────
    public List<Map<String, Object>> getOrgRequests(String statusFilter) {
        User provider = currentUser();
        Organization org = provider.getOrganization();
        if (org == null)
            throw new ApiManagerException("No organization found");

        List<ApiRequest> requests = statusFilter != null && !statusFilter.isBlank()
                ? requestRepo.findByOrganization_OrgIdAndStatusOrderBySubmittedAtDesc(org.getOrgId(), statusFilter)
                : requestRepo.findByOrganization_OrgIdOrderBySubmittedAtDesc(org.getOrgId());

        return requests.stream().map(this::toMap).toList();
    }

    // ── Provider: approve → create API as draft ───────────────────────────────
    @Transactional
    public Map<String, Object> approveRequest(Long requestId) {
        User provider = currentUser();
        ApiRequest req = getRequest(requestId);

        validateProviderOwnsRequest(req, provider);

        if (!"pending".equals(req.getStatus()) && !"changes_requested".equals(req.getStatus()))
            throw new ApiManagerException("Only pending or changes_requested requests can be approved");

        // create API in apis table as DRAFT
        Api api = Api.builder()
                .apiName(req.getApiName())
                .version("v1.0")
                .description(req.getDescription())
                .baseUrl(req.getBaseUrl())
                .visibility(req.getVisibility())
                .status("draft")
                .category(req.getCategory())
                .organization(req.getOrganization())
                .createdBy(req.getSubmittedBy()) // developer becomes API owner
                .build();

        Api savedApi = apiRepo.save(api);

        // create endpoints from JSON
        if (req.getEndpoints() != null) {
            try {
                List<Map<String, Object>> endpoints = objectMapper.readValue(
                        req.getEndpoints(), new TypeReference<>() {});
                for (Map<String, Object> ep : endpoints) {
                    ApiEndpoint endpoint = ApiEndpoint.builder()
                            .api(savedApi)
                            .httpMethod(ep.getOrDefault("httpMethod", "GET").toString().toUpperCase())
                            .path(ep.getOrDefault("path", "/").toString())
                            .description(ep.get("description") != null ? ep.get("description").toString() : null)
                            .isAuthenticated(true)
                            .build();
                    endpointRepo.save(endpoint);
                }
            } catch (Exception e) {
                log.warn("Failed to create endpoints from request: {}", e.getMessage());
            }
        }

        // update request status
        req.setStatus("approved");
        req.setReviewedBy(provider);
        req.setReviewedAt(LocalDateTime.now());
        req.setCreatedApi(savedApi);
        requestRepo.save(req);

        Map<String, Object> result = toMap(req);
        result.put("createdApiId", savedApi.getApiId());
        return result;
    }

    // ── Provider: reject request ──────────────────────────────────────────────
    @Transactional
    public Map<String, Object> rejectRequest(Long requestId, String reason) {
        User provider = currentUser();
        ApiRequest req = getRequest(requestId);

        validateProviderOwnsRequest(req, provider);

        if (!"pending".equals(req.getStatus()))
            throw new ApiManagerException("Only pending requests can be rejected");

        req.setStatus("rejected");
        req.setRejectionReason(reason);
        req.setReviewedBy(provider);
        req.setReviewedAt(LocalDateTime.now());

        return toMap(requestRepo.save(req));
    }

    // ── Provider: request changes ─────────────────────────────────────────────
    @Transactional
    public Map<String, Object> requestChanges(Long requestId, String feedback) {
        User provider = currentUser();
        ApiRequest req = getRequest(requestId);

        validateProviderOwnsRequest(req, provider);

        if (!"pending".equals(req.getStatus()))
            throw new ApiManagerException("Only pending requests can have changes requested");

        req.setStatus("changes_requested");
        req.setFeedback(feedback);
        req.setReviewedBy(provider);
        req.setReviewedAt(LocalDateTime.now());

        return toMap(requestRepo.save(req));
    }

    // ── Provider: pending count for badge ─────────────────────────────────────
    public long getPendingCount() {
        User provider = currentUser();
        Organization org = provider.getOrganization();
        if (org == null) return 0;
        return requestRepo.countByOrganization_OrgIdAndStatus(org.getOrgId(), "pending");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ApiManagerException("User not found"));
    }

    private ApiRequest getRequest(Long requestId) {
        return requestRepo.findById(requestId)
                .orElseThrow(() -> new ApiManagerException("Request not found"));
    }

    private void validateProviderOwnsRequest(ApiRequest req, User provider) {
        Organization providerOrg = provider.getOrganization();
        if (providerOrg == null || !providerOrg.getOrgId().equals(req.getOrganization().getOrgId()))
            throw new ApiManagerException("Not authorized to review this request");
    }

    private Map<String, Object> toMap(ApiRequest req) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("requestId",       req.getRequestId());
        m.put("apiName",         req.getApiName());
        m.put("description",     req.getDescription());
        m.put("baseUrl",         req.getBaseUrl());
        m.put("visibility",      req.getVisibility());
        m.put("status",          req.getStatus());
        m.put("rejectionReason", req.getRejectionReason());
        m.put("feedback",        req.getFeedback());
        m.put("submittedAt",     req.getSubmittedAt());
        m.put("reviewedAt",      req.getReviewedAt());
        m.put("categoryName",    req.getCategory() != null ? req.getCategory().getCategoryName() : null);
        m.put("submittedById",   req.getSubmittedBy() != null ? req.getSubmittedBy().getUserId() : null);
        m.put("submittedByName", req.getSubmittedBy() != null ? req.getSubmittedBy().getName() : null);
        m.put("reviewedByName",  req.getReviewedBy() != null ? req.getReviewedBy().getName() : null);
        m.put("createdApiId",    req.getCreatedApi() != null ? req.getCreatedApi().getApiId() : null);
        m.put("orgName",         req.getOrganization() != null ? req.getOrganization().getOrgName() : null);

        // parse endpoints back for response
        if (req.getEndpoints() != null) {
            try {
                m.put("endpoints", objectMapper.readValue(req.getEndpoints(), new TypeReference<List<Map<String, Object>>>() {}));
            } catch (Exception e) {
                m.put("endpoints", List.of());
            }
        } else {
            m.put("endpoints", List.of());
        }

        return m;
    }
}