package com.apimanager.portal.service;

import com.apimanager.common.exception.ApiManagerException;
import com.apimanager.identity.entity.Organization;
import com.apimanager.identity.entity.User;
import com.apimanager.identity.repository.OrganizationRepository;
import com.apimanager.identity.repository.UserRepository;
import com.apimanager.portal.dto.*;
import com.apimanager.portal.entity.*;
import com.apimanager.portal.repository.*;
import com.apimanager.registry.entity.Api;
import com.apimanager.registry.repository.ApiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;

import com.apimanager.portal.entity.SubscriptionEndpointPermission;
import com.apimanager.portal.repository.SubscriptionEndpointPermissionRepository;
import com.apimanager.registry.entity.ApiEndpoint;
import com.apimanager.registry.repository.ApiEndpointRepository;

@Service
@RequiredArgsConstructor
public class PortalService {

    private final ApplicationRepository          applicationRepo;
    private final SubscriptionRepository         subscriptionRepo;
    private final ApiKeyRepository               apiKeyRepo;
    private final ApiAllowedDeveloperRepository  allowedDevRepo;
    private final ApiUsageLogRepository          usageLogRepo;
    private final UserRepository                 userRepo;
    private final OrganizationRepository         orgRepo;
    private final ApiRepository                  apiRepo;
    private final BCryptPasswordEncoder          passwordEncoder;
    private final SubscriptionEndpointPermissionRepository permissionRepo;
    private final ApiEndpointRepository endpointRepo;

    private final SecureRandom secureRandom = new SecureRandom();

    // ── Applications ──────────────────────────────────────────────────────────

    @Transactional
    public ApplicationResponse createApplication(CreateApplicationRequest req, Long developerId) {
        User developer = getUser(developerId);

        // enforce unique app name per developer (schema constraint)
        if (applicationRepo.existsByDeveloper_UserIdAndAppName(developerId, req.getAppName()))
            throw new ApiManagerException("You already have an application named '" + req.getAppName() + "'");

        Application app = new Application();
        app.setDeveloper(developer);
        app.setOrganization(developer.getOrganization());
        app.setAppName(req.getAppName());
        app.setDescription(req.getDescription());
        app.setCallbackUrl(req.getCallbackUrl());
        app.setStatus("active");

        return toAppResponse(applicationRepo.save(app), 0);
    }

    public List<ApplicationResponse> getMyApplications(Long developerId) {
        User developer = getUser(developerId);
        return applicationRepo
            .findByDeveloper_UserId(developerId)
            .stream()
            .map(app -> {
                int subCount = subscriptionRepo.findByApplication_AppId(app.getAppId()).size();
                return toAppResponse(app, subCount);
            })
            .collect(Collectors.toList());
    }

    @Transactional
    public void deleteApplication(Long appId, Long developerId) {
        Application app = applicationRepo.findById(appId)
            .orElseThrow(() -> new ApiManagerException("Application not found"));
        if (!app.getDeveloper().getUserId().equals(developerId))
            throw new ApiManagerException("Not your application");

        // check no active subscriptions
        boolean hasActive = subscriptionRepo.findByApplication_AppId(appId)
            .stream().anyMatch(s -> "active".equals(s.getStatus()));
        if (hasActive)
            throw new ApiManagerException("Cancel all active subscriptions before deleting the application");

        applicationRepo.delete(app);
    }

    // ── Subscriptions ─────

    @Transactional
    public SubscriptionResponse subscribe(CreateSubscriptionRequest req, Long developerId) {
        User developer = getUser(developerId);

        Application app = applicationRepo.findById(req.getAppId())
            .orElseThrow(() -> new ApiManagerException("Application not found"));
        if (!app.getDeveloper().getUserId().equals(developerId))
            throw new ApiManagerException("Not your application");

        Api api = apiRepo.findById(req.getApiId())
            .orElseThrow(() -> new ApiManagerException("API not found"));

        // must be published
        if (!"published".equals(api.getStatus()))
            throw new ApiManagerException("API is not published");

        // org isolation — developer and API must be in same org
        Long devOrgId = developer.getOrganization().getOrgId();
        Long apiOrgId = api.getOrganization().getOrgId();
        if (!devOrgId.equals(apiOrgId))
            throw new ApiManagerException("API does not belong to your organization");

        // restricted visibility check
        if ("restricted".equals(api.getVisibility())) {
            if (!allowedDevRepo.existsByApi_ApiIdAndDeveloper_UserId(api.getApiId(), developerId))
                throw new ApiManagerException("You are not authorized to subscribe to this API");
        }

        // duplicate subscription check
        if (subscriptionRepo.existsByApplication_AppIdAndApi_ApiId(app.getAppId(), api.getApiId()))
            throw new ApiManagerException("This application is already subscribed to the API");

        // create subscription — auto-active, assigned to Basic plan
        Subscription sub = new Subscription();
        sub.setApi(api);
        sub.setApplication(app);
        sub.setStatus("active");
        sub = subscriptionRepo.save(sub);

        // auto-generate PRODUCTION API key for this subscription
        String rawKey = generateApiKey(sub, app, "PRODUCTION");

        SubscriptionResponse res = toSubResponse(sub);
        res.setClientId(rawKey);  // raw key shown ONCE on creation — must be saved by developer
        return res;
    }

    public List<SubscriptionResponse> getMySubscriptions(Long developerId) {
        return subscriptionRepo.findByApplication_Developer_UserId(developerId)
            .stream()
            .map(sub -> {
                SubscriptionResponse res = toSubResponse(sub);
                populateUsage(res, sub);
                return res;
            })
            .collect(Collectors.toList());
    }

    public List<SubscriptionResponse> getSubscriptionsForApp(Long appId, Long developerId) {
        Application app = applicationRepo.findById(appId)
            .orElseThrow(() -> new ApiManagerException("Application not found"));
        if (!app.getDeveloper().getUserId().equals(developerId))
            throw new ApiManagerException("Not your application");

        return subscriptionRepo.findByApplication_AppId(appId)
            .stream()
            .map(sub -> {
                SubscriptionResponse res = toSubResponse(sub);
                populateUsage(res, sub);
                return res;
            })
            .collect(Collectors.toList());
    }

    @Transactional
    public void cancelSubscription(Long subId, Long developerId) {
        Subscription sub = subscriptionRepo.findById(subId)
            .orElseThrow(() -> new ApiManagerException("Subscription not found"));
        if (!sub.getApplication().getDeveloper().getUserId().equals(developerId))
            throw new ApiManagerException("Not your subscription");
        sub.setStatus("cancelled");
        subscriptionRepo.save(sub);

        // revoke the API key
        apiKeyRepo.findBySubscription_SubscriptionId(subId)
            .ifPresent(k -> { k.setStatus("revoked"); apiKeyRepo.save(k); });
    }

    // Provider: list all subscriptions to their APIs
    public List<SubscriptionResponse> getSubscriptionsForMyApis(Long providerId) {
        User provider = getUser(providerId);
        if (provider.getOrganization() == null)
            throw new ApiManagerException("You have no organization");
        return subscriptionRepo
            .findByApi_Organization_OrgId(provider.getOrganization().getOrgId())
            .stream()
            .map(this::toSubResponse)
            .collect(Collectors.toList());
    }

    // Provider: suspend or reactivate a subscription
    @Transactional
    public SubscriptionResponse updateSubscriptionStatus(Long subId, String status, Long providerId) {
        Subscription sub = subscriptionRepo.findById(subId)
            .orElseThrow(() -> new ApiManagerException("Subscription not found"));

        if (!sub.getApi().getCreatedBy().getUserId().equals(providerId))
            throw new ApiManagerException("Not your API");

        // valid provider-controlled transitions: active ↔ blocked
        if (!List.of("active", "blocked").contains(status))
            throw new ApiManagerException("Invalid status — use 'active' or 'blocked'");

        sub.setStatus(status);

        // also suspend/reactivate the key
        apiKeyRepo.findBySubscription_SubscriptionId(subId).ifPresent(k -> {
            k.setStatus("active".equals(status) ? "active" : "revoked");
            apiKeyRepo.save(k);
        });

        return toSubResponse(subscriptionRepo.save(sub));
    }

    @Transactional
    public SubscriptionResponse grantAccess(Long developerId, Long apiId,
                                            List<Long> endpointIds, Long providerId) {
        // 1. Verify provider
        User provider = getUser(providerId);
        if (provider.getOrganization() == null)
            throw new ApiManagerException("Provider has no organization");
        Long orgId = provider.getOrganization().getOrgId();

        // 2. Verify developer belongs to same org
        User developer = getUser(developerId);
        if (developer.getOrganization() == null ||
            !developer.getOrganization().getOrgId().equals(orgId))
            throw new ApiManagerException("Developer does not belong to your organization");

        // 3. Verify API belongs to same org
        Api api = apiRepo.findById(apiId)
                .orElseThrow(() -> new ApiManagerException("API not found"));
        if (!api.getOrganization().getOrgId().equals(orgId))
            throw new ApiManagerException("API does not belong to your organization");
        if (!"published".equals(api.getStatus()))
            throw new ApiManagerException("API is not published");

        // 4. Find or create default app for developer
        Application app = applicationRepo
                .findByDeveloper_UserIdAndAppName(developerId, "Default App")
                .orElseGet(() -> {
                    Application newApp = new Application();
                    newApp.setDeveloper(developer);
                    newApp.setOrganization(developer.getOrganization());
                    newApp.setAppName("Default App");
                    newApp.setDescription("Auto-created by provider");
                    newApp.setStatus("active");
                    return applicationRepo.save(newApp);
                });

        // 5. Check if subscription already exists
        Optional<Subscription> existingOpt =
                subscriptionRepo.findByApplication_AppIdAndApi_ApiId(app.getAppId(), apiId);

        Subscription sub;
        boolean isNew = false;

        if (existingOpt.isPresent()) {
            sub = existingOpt.get();
            if ("active".equals(sub.getStatus()))
                throw new ApiManagerException("Developer already has active access to this API");
            // reactivate
            sub.setStatus("active");
            sub = subscriptionRepo.save(sub);
            // reactivate key
            apiKeyRepo.findBySubscription_SubscriptionId(sub.getSubscriptionId())
                    .ifPresent(k -> { k.setStatus("active"); apiKeyRepo.save(k); });
        } else {
            // create new
            sub = new Subscription();
            sub.setApi(api);
            sub.setApplication(app);
            sub.setStatus("active");
            sub.setApprovedBy(provider);
            sub = subscriptionRepo.save(sub);
            isNew = true;
        }

        // 6. Handle endpoint permissions
        // Clear existing permissions for this subscription
        permissionRepo.deleteBySubscription_SubscriptionId(sub.getSubscriptionId());

        boolean hasEndpointRestrictions = endpointIds != null && !endpointIds.isEmpty();

        if (hasEndpointRestrictions) {
            // Grant only specific endpoints
            for (Long endpointId : endpointIds) {
                ApiEndpoint endpoint = endpointRepo.findById(endpointId)
                        .orElseThrow(() -> new ApiManagerException("Endpoint not found: " + endpointId));
                SubscriptionEndpointPermission perm = new SubscriptionEndpointPermission();
                perm.setSubscription(sub);
                perm.setEndpoint(endpoint);
                permissionRepo.save(perm);
            }
        }
        // if endpointIds is null/empty → full access (no rows = all endpoints allowed)

        // 7. Generate API key for new subscriptions only
        String rawKey = null;
        if (isNew) {
            rawKey = generateApiKey(sub, app, "PRODUCTION");
        }

        SubscriptionResponse res = toSubResponse(sub);
        if (rawKey != null) res.setClientId(rawKey);
        return res;
    }


    // ── API Keys ────

    public ApiKeyResponse getKeyForSubscription(Long subId, Long developerId) {
        Subscription sub = subscriptionRepo.findById(subId)
            .orElseThrow(() -> new ApiManagerException("Subscription not found"));
        if (!sub.getApplication().getDeveloper().getUserId().equals(developerId))
            throw new ApiManagerException("Not your subscription");

        ApiKey key = apiKeyRepo.findBySubscription_SubscriptionId(subId)
            .orElseThrow(() -> new ApiManagerException("API key not found"));

        return toKeyResponse(key, null); // raw key NOT returned
    }

    @Transactional
    public ApiKeyResponse regenerateKey(Long subId, Long developerId) {
        Subscription sub = subscriptionRepo.findById(subId)
            .orElseThrow(() -> new ApiManagerException("Subscription not found"));
        if (!sub.getApplication().getDeveloper().getUserId().equals(developerId))
            throw new ApiManagerException("Not your subscription");

        // revoke old key
        apiKeyRepo.findBySubscription_SubscriptionId(subId).ifPresent(old -> {
            old.setStatus("revoked");
            apiKeyRepo.save(old);
        });

        // generate fresh key
        String rawKey = generateApiKey(sub, sub.getApplication(), "PRODUCTION");

        ApiKey newKey = apiKeyRepo.findBySubscription_SubscriptionId(subId)
            .orElseThrow(() -> new ApiManagerException("Key generation failed"));

        return toKeyResponse(newKey, rawKey); // raw key shown once
    }

    // ── Restricted Visibility ─────────

    public List<AllowedDeveloperResponse> getAllowedDevelopers(Long apiId, Long providerId) {
        Api api = getApiOwnedBy(apiId, providerId);
        if (!"restricted".equals(api.getVisibility()))
            throw new ApiManagerException("API visibility is not restricted");

        return allowedDevRepo.findByApi_ApiId(apiId).stream()
            .map(e -> {
                AllowedDeveloperResponse r = new AllowedDeveloperResponse();
                r.setUserId(e.getDeveloper().getUserId());
                r.setName(e.getDeveloper().getName());
                r.setEmail(e.getDeveloper().getEmail());
                r.setAddedAt(e.getAddedAt());
                return r;
            })
            .collect(Collectors.toList());
    }

    @Transactional
    public void addAllowedDeveloper(Long apiId, Long developerIdToAdd, Long providerId) {
        Api api = getApiOwnedBy(apiId, providerId);
        if (!"restricted".equals(api.getVisibility()))
            throw new ApiManagerException("API visibility is not restricted");

        User dev = getUser(developerIdToAdd);
        if (!dev.getOrganization().getOrgId().equals(api.getOrganization().getOrgId()))
            throw new ApiManagerException("Developer does not belong to the same organization");

        if (allowedDevRepo.existsByApi_ApiIdAndDeveloper_UserId(apiId, developerIdToAdd))
            return; // already allowed — idempotent

        ApiAllowedDeveloper entry = new ApiAllowedDeveloper();
        entry.setApi(api);
        entry.setDeveloper(dev);
        allowedDevRepo.save(entry);
    }

    @Transactional
    public void removeAllowedDeveloper(Long apiId, Long developerIdToRemove, Long providerId) {
        getApiOwnedBy(apiId, providerId); // ownership check
        allowedDevRepo.deleteByApi_ApiIdAndDeveloper_UserId(apiId, developerIdToRemove);
    }

    // ── Rate Limits ─────

    @Transactional
    public void updateRateLimits(Long apiId, RateLimitRequest req, Long providerId) {
        Api api = getApiOwnedBy(apiId, providerId);
        api.setRateLimitPerMinute(req.getRateLimitPerMinute());
        api.setRateLimitPerHour(req.getRateLimitPerHour());
        api.setRateLimitPerDay(req.getRateLimitPerDay());
        api.setRateLimitTotal(req.getRateLimitTotal());
        apiRepo.save(api);
    }

    // ── Private helpers ─────

    /**
     * Generates a new API key for a subscription.
     * Stores bcrypt hash as client_secret in DB.
     * Returns the raw key — caller must include it in response (shown once).
     */
    private String generateApiKey(Subscription sub, Application app, String keyType) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String rawKey = "am_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        ApiKey key = new ApiKey();
        key.setApplication(app);
        key.setSubscription(sub);
        key.setClientId(rawKey);                           // stored as-is (public identifier)
        key.setClientSecret(passwordEncoder.encode(rawKey)); // bcrypt hash
        key.setKeyType(keyType);
        key.setStatus("active");
        apiKeyRepo.save(key);

        return rawKey;
    }

    private void populateUsage(SubscriptionResponse res, Subscription sub) {
        LocalDateTime now = LocalDateTime.now();
        Long subId = sub.getSubscriptionId();
        res.setUsedPerMinute(usageLogRepo.countCallsSince(subId, now.minusMinutes(1)));
        res.setUsedPerHour(usageLogRepo.countCallsSince(subId, now.minusHours(1)));
        res.setUsedPerDay(usageLogRepo.countCallsSince(subId, now.minusDays(1)));
        res.setUsedTotal(usageLogRepo.countTotalCalls(subId));
    }

    private Api getApiOwnedBy(Long apiId, Long providerId) {
        Api api = apiRepo.findById(apiId)
            .orElseThrow(() -> new ApiManagerException("API not found"));
        if (!api.getCreatedBy().getUserId().equals(providerId))
            throw new ApiManagerException("Not your API");
        return api;
    }

    private User getUser(Long userId) {
        return userRepo.findById(userId)
            .orElseThrow(() -> new ApiManagerException("User not found"));
    }

    // ── Mappers ──────
    private ApplicationResponse toAppResponse(Application app, int subCount) {
        ApplicationResponse r = new ApplicationResponse();
        r.setAppId(app.getAppId());
        r.setAppName(app.getAppName());
        r.setDescription(app.getDescription());
        r.setCallbackUrl(app.getCallbackUrl());
        r.setStatus(app.getStatus());
        r.setDeveloperId(app.getDeveloper().getUserId());
        r.setDeveloperName(app.getDeveloper().getName());
        r.setOrgId(app.getOrganization() != null ? app.getOrganization().getOrgId() : null);
        r.setSubscriptionCount(subCount);
        r.setCreatedAt(app.getCreatedAt());
        return r;
    }

    private SubscriptionResponse toSubResponse(Subscription sub) {
        SubscriptionResponse r = new SubscriptionResponse();
        r.setSubscriptionId(sub.getSubscriptionId());
        r.setAppId(sub.getApplication().getAppId());
        r.setAppName(sub.getApplication().getAppName());
        r.setApiId(sub.getApi().getApiId());
        r.setApiName(sub.getApi().getApiName());
        r.setApiVersion(sub.getApi().getVersion());
        r.setApiBaseUrl(sub.getApi().getBaseUrl());
        r.setStatus(sub.getStatus());
        r.setSubscribedAt(sub.getCreatedAt());
        // rate limits from the API
        r.setRateLimitPerMinute(sub.getApi().getRateLimitPerMinute());
        r.setRateLimitPerHour(sub.getApi().getRateLimitPerHour());
        r.setRateLimitPerDay(sub.getApi().getRateLimitPerDay());
        r.setRateLimitTotal(sub.getApi().getRateLimitTotal());
        // key clientId (masked — not the secret)
        apiKeyRepo.findBySubscription_SubscriptionId(sub.getSubscriptionId())
            .ifPresent(k -> r.setClientId(k.getClientId()));
        return r;
    }

    private ApiKeyResponse toKeyResponse(ApiKey key, String rawKey) {
        ApiKeyResponse r = new ApiKeyResponse();
        r.setKeyId(key.getKeyId());
        r.setClientId(key.getClientId());
        r.setRawKey(rawKey); // null unless just created or regenerated
        r.setKeyType(key.getKeyType());
        r.setStatus(key.getStatus());
        r.setSubscriptionId(key.getSubscription().getSubscriptionId());
        r.setApiName(key.getSubscription().getApi().getApiName());
        r.setAppName(key.getApplication().getAppName());
        r.setCreatedAt(key.getCreatedAt());
        r.setLastUsedAt(key.getLastUsedAt());
        return r;
    }
}