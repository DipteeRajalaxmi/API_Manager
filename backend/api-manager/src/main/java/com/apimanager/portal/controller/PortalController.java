package com.apimanager.portal.controller;

import com.apimanager.common.security.JwtUtil;
import com.apimanager.portal.dto.*;
import com.apimanager.portal.service.PortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/portal")
@RequiredArgsConstructor
public class PortalController {

    private final PortalService portalService;
    private final JwtUtil       jwtUtil;

    // ── Applications ──────────────────────────────────────────────────────────

    @PostMapping("/applications")
    public ResponseEntity<ApplicationResponse> createApp(
            @RequestBody CreateApplicationRequest req,
            HttpServletRequest http) {
        return ResponseEntity.ok(portalService.createApplication(req, userId(http)));
    }

    @GetMapping("/applications")
    public ResponseEntity<List<ApplicationResponse>> getMyApps(HttpServletRequest http) {
        return ResponseEntity.ok(portalService.getMyApplications(userId(http)));
    }

    @DeleteMapping("/applications/{appId}")
    public ResponseEntity<Void> deleteApp(
            @PathVariable Long appId,
            HttpServletRequest http) {
        portalService.deleteApplication(appId, userId(http));
        return ResponseEntity.noContent().build();
    }

    // ── Subscriptions ─────────────────────────────────────────────────────────

    /** Developer: subscribe app to an API — returns subscription + raw API key (shown once) */
    @PostMapping("/subscriptions")
    public ResponseEntity<SubscriptionResponse> subscribe(
            @RequestBody CreateSubscriptionRequest req,
            HttpServletRequest http) {
        return ResponseEntity.ok(portalService.subscribe(req, userId(http)));
    }

    /** Developer: all my subscriptions across all apps */
    @GetMapping("/subscriptions")
    public ResponseEntity<List<SubscriptionResponse>> getMySubscriptions(HttpServletRequest http) {
        return ResponseEntity.ok(portalService.getMySubscriptions(userId(http)));
    }

    /** Developer: subscriptions for a specific app */
    @GetMapping("/applications/{appId}/subscriptions")
    public ResponseEntity<List<SubscriptionResponse>> getAppSubscriptions(
            @PathVariable Long appId,
            HttpServletRequest http) {
        return ResponseEntity.ok(portalService.getSubscriptionsForApp(appId, userId(http)));
    }

    /** Developer: cancel a subscription */
    @DeleteMapping("/subscriptions/{subId}")
    public ResponseEntity<Void> cancelSubscription(
            @PathVariable Long subId,
            HttpServletRequest http) {
        portalService.cancelSubscription(subId, userId(http));
        return ResponseEntity.noContent().build();
    }

    /** Provider: see all subscriptions to my APIs */
    @GetMapping("/provider/subscriptions")
    public ResponseEntity<List<SubscriptionResponse>> getProviderSubscriptions(HttpServletRequest http) {
        return ResponseEntity.ok(portalService.getSubscriptionsForMyApis(userId(http)));
    }

    /** Provider: block or reactivate a subscription (active | blocked) */
    @PatchMapping("/provider/subscriptions/{subId}/status")
    public ResponseEntity<SubscriptionResponse> updateSubStatus(
            @PathVariable Long subId,
            @RequestParam String status,
            HttpServletRequest http) {
        return ResponseEntity.ok(portalService.updateSubscriptionStatus(subId, status, userId(http)));
    }

   @PostMapping("/provider/grant-access")
    public ResponseEntity<SubscriptionResponse> grantAccess(
            @RequestBody GrantAccessRequest req,
            HttpServletRequest http) {
        return ResponseEntity.ok(
            portalService.grantAccess(
                req.getDeveloperId(),
                req.getApiId(),
                req.getEndpointIds(),
                userId(http)
            )
        );
    }



    // ── API Keys ──────────────────────────────────────────────────────────────

    /** Developer: get key metadata for a subscription (raw key NOT returned) */
    @GetMapping("/subscriptions/{subId}/key")
    public ResponseEntity<ApiKeyResponse> getKey(
            @PathVariable Long subId,
            HttpServletRequest http) {
        return ResponseEntity.ok(portalService.getKeyForSubscription(subId, userId(http)));
    }

    /** Developer: regenerate key (old key revoked, new raw key returned once) */
    @PostMapping("/subscriptions/{subId}/key/regenerate")
    public ResponseEntity<ApiKeyResponse> regenerateKey(
            @PathVariable Long subId,
            HttpServletRequest http) {
        return ResponseEntity.ok(portalService.regenerateKey(subId, userId(http)));
    }

    // ── Rate Limits (Provider) ────────────────────────────────────────────────

    /** Provider: set rate limits on one of their APIs (null fields = disable that limit) */
    @PutMapping("/provider/apis/{apiId}/rate-limits")
    public ResponseEntity<Void> setRateLimits(
            @PathVariable Long apiId,
            @RequestBody RateLimitRequest req,
            HttpServletRequest http) {
        portalService.updateRateLimits(apiId, req, userId(http));
        return ResponseEntity.ok().build();
    }

    // ── Restricted Visibility (Provider) ─────────────────────────────────────

    /** Provider: list developers allowed to see + subscribe to a restricted API */
    @GetMapping("/provider/apis/{apiId}/allowed-developers")
    public ResponseEntity<List<AllowedDeveloperResponse>> getAllowedDevs(
            @PathVariable Long apiId,
            HttpServletRequest http) {
        return ResponseEntity.ok(portalService.getAllowedDevelopers(apiId, userId(http)));
    }

    /** Provider: grant a developer access to a restricted API */
    @PostMapping("/provider/apis/{apiId}/allowed-developers/{developerId}")
    public ResponseEntity<Void> addAllowedDev(
            @PathVariable Long apiId,
            @PathVariable Long developerId,
            HttpServletRequest http) {
        portalService.addAllowedDeveloper(apiId, developerId, userId(http));
        return ResponseEntity.ok().build();
    }

    /** Provider: revoke a developer's access to a restricted API */
    @DeleteMapping("/provider/apis/{apiId}/allowed-developers/{developerId}")
    public ResponseEntity<Void> removeAllowedDev(
            @PathVariable Long apiId,
            @PathVariable Long developerId,
            HttpServletRequest http) {
        portalService.removeAllowedDeveloper(apiId, developerId, userId(http));
        return ResponseEntity.noContent().build();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Long userId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}