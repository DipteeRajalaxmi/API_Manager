package com.apimanager.gateway.service;

import com.apimanager.common.exception.ApiManagerException;
import com.apimanager.portal.entity.ApiKey;
import com.apimanager.portal.entity.ApiUsageLog;
import com.apimanager.portal.entity.Subscription;
import com.apimanager.portal.repository.ApiKeyRepository;
import com.apimanager.portal.repository.ApiUsageLogRepository;
import com.apimanager.registry.repository.ApiPlanLimitRepository;
import com.apimanager.registry.entity.ApiPlanLimit;
import com.apimanager.registry.entity.Api;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.apimanager.gateway.service.IpBlocklistService;
import com.apimanager.registry.entity.ApiEndpoint;
import java.util.List;

import com.apimanager.portal.repository.SubscriptionEndpointPermissionRepository;
 
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Enumeration;

@Slf4j
@Service
@RequiredArgsConstructor

public class GatewayService {
    private final ApiKeyRepository    apiKeyRepo;
    private final ApiUsageLogRepository usageLogRepo;
    private final RestTemplate        restTemplate;
    private final SubscriptionEndpointPermissionRepository permissionRepo;
    private final ApiPlanLimitRepository apiPlanLimitRepo;
    private final AsyncLogService asyncLogService;
    private final CachedGatewayDataService cachedGatewayData;

    private final java.util.concurrent.ConcurrentHashMap<Long, CircuitBreakerState> circuitBreakers
    = new java.util.concurrent.ConcurrentHashMap<>();

     public GatewayResult handle(
        String rawKey,
        String apiPath,
        HttpMethod method,
        byte[] body,
        HttpServletRequest request
        )
    {
        long startMs = System.currentTimeMillis();
 
        // ── 1. Validate API key ──────────────────────────────────────────────
        ApiKey apiKey = cachedGatewayData.findApiKey(rawKey)
            .orElseThrow(() -> new GatewayAuthException("Invalid API key"));
 
        if (!"active".equals(apiKey.getStatus()))
            throw new GatewayAuthException("API key is revoked or expired");
 
       Subscription sub = apiKey.getSubscription();
        if (sub == null)
            throw new GatewayAuthException("No subscription linked to this key");

        // ── Extract plan-based client headers ────────────────────────────────────
        String clientId   = request.getHeader("X-Client-Id");
        String clientPlan = request.getHeader("X-Client-Plan");
        String trackingKey = (clientId != null && !clientId.isBlank())
                ? sub.getSubscriptionId() + ":" + clientId
                : sub.getSubscriptionId().toString();
 
        // ── 2. Check subscription status ─────────────────────────────────────
        if (!"active".equals(sub.getStatus()))
            throw new GatewayAuthException("Subscription is " + sub.getStatus());

         if (!"active".equals(sub.getApplication().getDeveloper().getStatus()))
            throw new GatewayAuthException("Developer account is deactivated");

        Api api = sub.getApi();
        String normalizedPath = "/" + apiPath;

        // ── 2.5 Check API blocked ─────────────────────────────────────────────────
        if (Boolean.TRUE.equals(api.getIsBlocked())) {
            logCall(apiKey, sub, null, apiPath, method.name(), request,
            503L, System.currentTimeMillis() - startMs, false, null,
            clientId, clientPlan, trackingKey);
            throw new ServiceBlockedException(
                    "API is temporarily unavailable",
                    api.getBlockedReason() != null ? api.getBlockedReason() : "This API has been blocked by the provider"
            );
        }
        

        // 3a. Match endpoint
        ApiEndpoint matchedEndpoint = findMatchingEndpoint(api, normalizedPath, method.name());

        // ── 3.1 Check endpoint blocked ────────────────────────────────────────────
    if (matchedEndpoint != null && Boolean.TRUE.equals(matchedEndpoint.getIsBlocked())) {
        logCall(apiKey, sub, matchedEndpoint, apiPath, method.name(), request,
                503L, System.currentTimeMillis() - startMs, false, null,clientId, clientPlan, trackingKey);
        throw new ServiceBlockedException(
                "Endpoint is temporarily unavailable",
                matchedEndpoint.getBlockedReason() != null ? matchedEndpoint.getBlockedReason() : "This endpoint has been blocked by the provider"
        );
    }


    if (matchedEndpoint != null) {
        boolean hasRestrictions = permissionRepo
                .existsBySubscription_SubscriptionId(sub.getSubscriptionId());
        if (hasRestrictions) {
            boolean isAllowed = permissionRepo
                    .existsBySubscription_SubscriptionIdAndEndpoint_EndpointId(
                        sub.getSubscriptionId(), matchedEndpoint.getEndpointId());
            if (!isAllowed) {
                logCall(apiKey, sub, matchedEndpoint, apiPath, method.name(), request,
                        403L, System.currentTimeMillis() - startMs, false, null,clientId, clientPlan, trackingKey);
                throw new EndpointNotPermittedException(
                    "You do not have access to this endpoint");
            }
        }
    }


        // 3b. Check endpoint-level rate limits first
        if (matchedEndpoint != null) {
            RateLimitResult epRl = checkEndpointRateLimits(
                sub.getSubscriptionId(), matchedEndpoint, normalizedPath, trackingKey, clientId);
            if (epRl.exceeded) {
                logCall(apiKey, sub, matchedEndpoint, apiPath, method.name(), request,
                        429L, System.currentTimeMillis() - startMs, true,
                        "ENDPOINT_" + epRl.limitType,clientId, clientPlan, trackingKey);
                throw new RateLimitException(
                        "ENDPOINT_" + epRl.limitType, epRl.limit, epRl.retryAfterSeconds);
            }
        }

        // 3c. Check API-level rate limits
        RateLimitResult rl = checkRateLimitsWithPlan(trackingKey, api, clientPlan, clientId);
        if (rl.exceeded) {
            logCall(apiKey, sub, matchedEndpoint, apiPath, method.name(), request,
                    429L, System.currentTimeMillis() - startMs, true, rl.limitType,clientId, clientPlan, trackingKey);
            throw new RateLimitException(rl.limitType, rl.limit, rl.retryAfterSeconds);
        }

        // ── 3.5 Circuit breaker check ─────────────────────────────────────────────
        Long apiId = api.getApiId();
        CircuitBreakerState circuit = circuitBreakers.computeIfAbsent(apiId, k -> new CircuitBreakerState());
        if (circuit.isOpen()) {
            logCall(apiKey, sub, matchedEndpoint, apiPath, method.name(), request,
                    503L, System.currentTimeMillis() - startMs, false, null,clientId, clientPlan, trackingKey);
            throw new CircuitOpenException("Circuit open for API: " + api.getApiName());
        }
 
        // ── 4. Forward request to provider backend ───────────────────────────
        String targetUrl = buildTargetUrl(api.getBaseUrl(), apiPath, request.getQueryString());
 
        HttpHeaders forwardHeaders = buildForwardHeaders(request, sub);
        HttpEntity<byte[]> entity  = new HttpEntity<>(body, forwardHeaders);

        ResponseEntity<byte[]> upstream;
        try {
            upstream = restTemplate.exchange(targetUrl, method, entity, byte[].class);
            circuit.recordSuccess();
        } catch (org.springframework.web.client.ResourceAccessException e) {
            log.error("Gateway upstream unreachable: {}", e.getMessage());
            circuit.recordFailure();
            logCall(apiKey, sub, matchedEndpoint, apiPath, method.name(), request,
                502L, System.currentTimeMillis() - startMs, false, null,clientId, clientPlan, trackingKey);
            throw new UpstreamUnavailableException("Upstream unreachable: " + targetUrl, e.getMessage());

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            log.error("Gateway upstream returned error: {}", e.getStatusCode());
            circuit.recordSuccess();
            logCall(apiKey, sub, matchedEndpoint, apiPath, method.name(), request,
                (long) e.getStatusCode().value(), System.currentTimeMillis() - startMs, false, null,clientId, clientPlan, trackingKey);
            throw new UpstreamUnavailableException("Upstream error " + e.getStatusCode(), e.getMessage());

        } catch (Exception e) {
            log.error("Gateway upstream error: {}", e.getMessage());
            circuit.recordFailure();
            logCall(apiKey, sub, matchedEndpoint, apiPath, method.name(), request,
                502L, System.currentTimeMillis() - startMs, false, null,clientId, clientPlan, trackingKey);
            throw new ApiManagerException("Upstream service error: " + e.getMessage());
        }
 
        long latency = System.currentTimeMillis() - startMs;
 
        // ── 5. Log successful call ────────────────────────────────────────────
        logCall(apiKey, sub, matchedEndpoint, apiPath, method.name(), request,
            (long) upstream.getStatusCode().value(), latency, false, null,clientId, clientPlan, trackingKey);
        
 
        // ── 6. Update key last_used_at (async — non-blocking) ─────────────────
        asyncLogService.updateKeyLastUsed(apiKey.getKeyId());
 
        // ── 7. Build rate limit headers for response ──────────────────────────
        RateLimitHeaders headers = buildRateLimitHeaders(
            sub.getSubscriptionId(), api, matchedEndpoint, normalizedPath);
 
        return new GatewayResult(upstream, headers);
    }
 
    // ── Rate limit check ──────────────────────────────────────────────────────
 
    private RateLimitResult checkRateLimits(Long subId, Api api) {
        LocalDateTime now = LocalDateTime.now();
 
        if (api.getRateLimitPerMinute() != null) {
            long used = usageLogRepo.countCallsSince(subId, now.minusMinutes(1));
            if (used >= api.getRateLimitPerMinute())
                return RateLimitResult.exceeded("PER_MINUTE", api.getRateLimitPerMinute(), 60);
        }
 
        if (api.getRateLimitPerHour() != null) {
            long used = usageLogRepo.countCallsSince(subId, now.minusHours(1));
            if (used >= api.getRateLimitPerHour())
                return RateLimitResult.exceeded("PER_HOUR", api.getRateLimitPerHour(), 3600);
        }
 
        if (api.getRateLimitPerDay() != null) {
            long used = usageLogRepo.countCallsSince(subId, now.minusDays(1));
            if (used >= api.getRateLimitPerDay())
                return RateLimitResult.exceeded("PER_DAY", api.getRateLimitPerDay(), 86400);
        }
 
        if (api.getRateLimitTotal() != null) {
            long used = usageLogRepo.countTotalCalls(subId);
            if (used >= api.getRateLimitTotal())
                return RateLimitResult.exceeded("TOTAL", api.getRateLimitTotal(), 0);
        }
 
        return RateLimitResult.ok();
    }

    private RateLimitResult checkRateLimitsWithPlan(
        String trackingKey, Api api, String clientPlan, String clientId) {
    LocalDateTime now = LocalDateTime.now();

    // Plan limits take priority if plan header provided
    if (clientPlan != null && !clientPlan.isBlank()) {
        ApiPlanLimit planLimit = cachedGatewayData
                .findPlanLimit(api.getApiId(), clientPlan)
                .orElse(null);

        if (planLimit != null) {
            if (planLimit.getRateLimitPerMinute() != null) {
                long used = usageLogRepo.countCallsSinceByTrackingKey(trackingKey, now.minusMinutes(1));
                if (used >= planLimit.getRateLimitPerMinute())
                    return RateLimitResult.exceeded("PLAN_PER_MINUTE", planLimit.getRateLimitPerMinute(), 60);
            }
            if (planLimit.getRateLimitPerHour() != null) {
                long used = usageLogRepo.countCallsSinceByTrackingKey(trackingKey, now.minusHours(1));
                if (used >= planLimit.getRateLimitPerHour())
                    return RateLimitResult.exceeded("PLAN_PER_HOUR", planLimit.getRateLimitPerHour(), 3600);
            }
            if (planLimit.getRateLimitPerDay() != null) {
                long used = usageLogRepo.countCallsSinceByTrackingKey(trackingKey, now.minusDays(1));
                if (used >= planLimit.getRateLimitPerDay())
                    return RateLimitResult.exceeded("PLAN_PER_DAY", planLimit.getRateLimitPerDay(), 86400);
            }
            if (planLimit.getRateLimitTotal() != null) {
                long used = usageLogRepo.countTotalCallsByTrackingKey(trackingKey);
                if (used >= planLimit.getRateLimitTotal())
                    return RateLimitResult.exceeded("PLAN_TOTAL", planLimit.getRateLimitTotal(), 0);
            }
            return RateLimitResult.ok();
        }
    }

    // Fallback — per-client API limits if clientId present, else subscription-level
    if (clientId != null && !clientId.isBlank()) {
        return checkRateLimitsPerClient(trackingKey, api);
    } else {
        return checkRateLimits(Long.parseLong(trackingKey.split(":")[0]), api);
    }
}   // ← this closes checkRateLimitsWithPlan

private RateLimitResult checkRateLimitsPerClient(String trackingKey, Api api) {
    LocalDateTime now = LocalDateTime.now();

    if (api.getRateLimitPerMinute() != null) {
        long used = usageLogRepo.countCallsSinceByTrackingKey(trackingKey, now.minusMinutes(1));
        if (used >= api.getRateLimitPerMinute())
            return RateLimitResult.exceeded("PER_MINUTE", api.getRateLimitPerMinute(), 60);
    }
    if (api.getRateLimitPerHour() != null) {
        long used = usageLogRepo.countCallsSinceByTrackingKey(trackingKey, now.minusHours(1));
        if (used >= api.getRateLimitPerHour())
            return RateLimitResult.exceeded("PER_HOUR", api.getRateLimitPerHour(), 3600);
    }
    if (api.getRateLimitPerDay() != null) {
        long used = usageLogRepo.countCallsSinceByTrackingKey(trackingKey, now.minusDays(1));
        if (used >= api.getRateLimitPerDay())
            return RateLimitResult.exceeded("PER_DAY", api.getRateLimitPerDay(), 86400);
    }
    if (api.getRateLimitTotal() != null) {
        long used = usageLogRepo.countTotalCallsByTrackingKey(trackingKey);
        if (used >= api.getRateLimitTotal())
            return RateLimitResult.exceeded("TOTAL", api.getRateLimitTotal(), 0);
    }
    return RateLimitResult.ok();
}
 
    private RateLimitHeaders buildRateLimitHeaders(
        Long subId, Api api, ApiEndpoint endpoint, String path) {
        LocalDateTime now = LocalDateTime.now();
        RateLimitHeaders h = new RateLimitHeaders();
 
        if (api.getRateLimitPerMinute() != null) {
            long used = usageLogRepo.countCallsSince(subId, now.minusMinutes(1));
            h.remainingMinute = Math.max(0, api.getRateLimitPerMinute() - used);
            h.limitMinute     = api.getRateLimitPerMinute();
        }
        if (api.getRateLimitPerHour() != null) {
            long used = usageLogRepo.countCallsSince(subId, now.minusHours(1));
            h.remainingHour = Math.max(0, api.getRateLimitPerHour() - used);
            h.limitHour     = api.getRateLimitPerHour();
        }
        if (api.getRateLimitPerDay() != null) {
            long used = usageLogRepo.countCallsSince(subId, now.minusDays(1));
            h.remainingDay = Math.max(0, api.getRateLimitPerDay() - used);
            h.limitDay     = api.getRateLimitPerDay();
        }
        if (api.getRateLimitTotal() != null) {
            long used = usageLogRepo.countTotalCalls(subId);
            h.remainingTotal = Math.max(0, api.getRateLimitTotal() - used);
            h.limitTotal     = api.getRateLimitTotal();
        }
        // Endpoint level headers
        if (endpoint != null) {
            if (endpoint.getRateLimitPerMinute() != null) {
                long used = usageLogRepo.countCallsSinceForEndpoint(subId, path, now.minusMinutes(1));
                h.endpointLimitMinute     = endpoint.getRateLimitPerMinute();
                h.endpointRemainingMinute = Math.max(0, endpoint.getRateLimitPerMinute() - used);
            }
            if (endpoint.getRateLimitPerHour() != null) {
                long used = usageLogRepo.countCallsSinceForEndpoint(subId, path, now.minusHours(1));
                h.endpointLimitHour     = endpoint.getRateLimitPerHour();
                h.endpointRemainingHour = Math.max(0, endpoint.getRateLimitPerHour() - used);
            }
            if (endpoint.getRateLimitPerDay() != null) {
                long used = usageLogRepo.countCallsSinceForEndpoint(subId, path, now.minusDays(1));
                h.endpointLimitDay     = endpoint.getRateLimitPerDay();
                h.endpointRemainingDay = Math.max(0, endpoint.getRateLimitPerDay() - used);
            }
            if (endpoint.getRateLimitTotal() != null) {
                long used = usageLogRepo.countTotalCallsForEndpoint(subId, path);
                h.endpointLimitTotal     = endpoint.getRateLimitTotal();
                h.endpointRemainingTotal = Math.max(0, endpoint.getRateLimitTotal() - used);
            }
        }
        return h;
    }
 
    // ── Helpers ───────────────────────────────────────────────────────────────
 
    private String buildTargetUrl(String baseUrl, String path, String queryString) {
        String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String p    = path.startsWith("/") ? path : "/" + path;
        return queryString != null ? base + p + "?" + queryString : base + p;
    }
 
    private HttpHeaders buildForwardHeaders(HttpServletRequest request, Subscription sub) {
        HttpHeaders headers = new HttpHeaders();
        Enumeration<String> names = request.getHeaderNames();
        while (names != null && names.hasMoreElements()) {
            String name = names.nextElement();
            // skip hop-by-hop headers + our own auth header
            if (!name.equalsIgnoreCase("host") &&
                !name.equalsIgnoreCase("x-api-key") &&
                !name.equalsIgnoreCase("connection")) {
                headers.put(name, Collections.list(request.getHeaders(name)));
            }
        }
        // add forwarded-for
        String ip = getClientIp(request);
        headers.set("X-Forwarded-For", ip);
        headers.set("X-Gateway-By", "APIManager");
        headers.set("X-Developer-Id",     sub.getApplication().getDeveloper().getUserId().toString());
        headers.set("X-Developer-Name",   sub.getApplication().getDeveloper().getName());
        headers.set("X-App-Name",         sub.getApplication().getAppName());
        headers.set("X-Subscription-Id",  sub.getSubscriptionId().toString());
        headers.set("X-Organization-Id",  sub.getApi().getOrganization().getOrgId().toString());
        return headers;
    }
 
       private void logCall(ApiKey apiKey, Subscription sub, ApiEndpoint endpoint,
            String path, String method, HttpServletRequest request,
                Long status, Long latency,
                boolean rateLimited, String rateLimitType,
                String clientId, String clientPlan, String trackingKey) {
        // Extract request data synchronously (can't access request in async thread)
        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        // Fire and forget — does NOT block the gateway response
        asyncLogService.logCall(
            apiKey, sub, endpoint, path, method,
            ipAddress, userAgent,
            status, latency, rateLimited, rateLimitType,
            clientId, clientPlan, trackingKey
        );
    }
 
    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty())
            return forwarded.split(",")[0].trim();
        return request.getRemoteAddr();
    }
 
    // ── Inner result/exception classes ────────────────────────────────────────
    // raw byte data 
    public record GatewayResult(ResponseEntity<byte[]> upstream, RateLimitHeaders rateLimitHeaders) {}

 
    public static class RateLimitHeaders {
        public Long limitMinute, remainingMinute;
        public Long limitHour,   remainingHour;
        public Long limitDay,    remainingDay;
        public Long limitTotal,  remainingTotal;
        public Long endpointLimitMinute,     endpointRemainingMinute;
        public Long endpointLimitHour,       endpointRemainingHour;
        public Long endpointLimitDay,        endpointRemainingDay;
        public Long endpointLimitTotal, endpointRemainingTotal;
    }
 
    private static class RateLimitResult {
        boolean exceeded;
        String  limitType;
        long    limit;
        long    retryAfterSeconds;
 
        static RateLimitResult ok() {
            RateLimitResult r = new RateLimitResult();
            r.exceeded = false;
            return r;
        }
 
        static RateLimitResult exceeded(String type, long limit, long retryAfter) {
            RateLimitResult r = new RateLimitResult();
            r.exceeded           = true;
            r.limitType          = type;
            r.limit              = limit;
            r.retryAfterSeconds  = retryAfter;
            return r;
        }
    }


    private static class CircuitBreakerState {
        private static final int    FAILURE_THRESHOLD = 10;
        private static final long   COOLDOWN_MS       = 30_000; // 30 seconds

        private int  failures    = 0;
        private long openedAt    = 0;
        private boolean open     = false;

        synchronized boolean isOpen() {
            if (!open) return false;
            // check if cooldown passed — half-open
            if (System.currentTimeMillis() - openedAt > COOLDOWN_MS) {
                open = false; // allow one request through
                return false;
            }
            return true;
        }

        synchronized void recordFailure() {
            failures++;
            if (failures >= FAILURE_THRESHOLD) {
                open     = true;
                openedAt = System.currentTimeMillis();
                failures = 0;
            }
        }

        synchronized void recordSuccess() {
            failures = 0;
            open     = false;
        }
    }
 
    // ── Custom exceptions ─────────────────────────────────────────────────────
 
    public static class GatewayAuthException extends RuntimeException {
        public GatewayAuthException(String message) { super(message); }
    }
 
    public static class RateLimitException extends RuntimeException {
        public final String limitType;
        public final long   limit;
        public final long   retryAfterSeconds;
 
        public RateLimitException(String limitType, long limit, long retryAfterSeconds) {
            super("Rate limit exceeded: " + limitType);
            this.limitType         = limitType;
            this.limit             = limit;
            this.retryAfterSeconds = retryAfterSeconds;
        }
    }

    public static class CircuitOpenException extends RuntimeException {
        public CircuitOpenException(String message) { super(message); }
    }

    private ApiEndpoint findMatchingEndpoint(Api api, String requestPath, String method) {
        if (api.getEndpoints() == null || api.getEndpoints().isEmpty()) return null;
        // exact match with method first
        for (ApiEndpoint ep : api.getEndpoints()) {
            if (ep.getHttpMethod().equalsIgnoreCase(method) && pathMatches(ep.getPath(), requestPath))
                return ep;
        }
        // fallback: path only
        for (ApiEndpoint ep : api.getEndpoints()) {
            if (pathMatches(ep.getPath(), requestPath)) return ep;
        }
        return null;
    }

    private boolean pathMatches(String template, String actual) {
        if (template == null || actual == null) return false;
        if (template.equals(actual)) return true;
        String t = template.endsWith("/") ? template.substring(0, template.length()-1) : template;
        String a = actual.endsWith("/")   ? actual.substring(0, actual.length()-1)     : actual;
        String regex = t.replaceAll("\\{[^}]+\\}", "[^/]+").replace("/", "\\/");
        return a.matches(regex);
    }

    private RateLimitResult checkEndpointRateLimits(
        Long subId, ApiEndpoint endpoint, String path, String trackingKey, String clientId) {
        LocalDateTime now = LocalDateTime.now();

        // If clientId present → count only this client's calls to this endpoint
        // If no clientId → count all calls to this endpoint under this subscription (original)
        boolean perClient = clientId != null && !clientId.isBlank();

        if (endpoint.getRateLimitPerMinute() != null) {
            long used = perClient
                ? usageLogRepo.countCallsSinceByTrackingKeyAndPath(trackingKey, path, now.minusMinutes(1))
                : usageLogRepo.countCallsSinceForEndpoint(subId, path, now.minusMinutes(1));
            if (used >= endpoint.getRateLimitPerMinute())
                return RateLimitResult.exceeded("PER_MINUTE", endpoint.getRateLimitPerMinute(), 60);
        }
        if (endpoint.getRateLimitPerHour() != null) {
            long used = perClient
                ? usageLogRepo.countCallsSinceByTrackingKeyAndPath(trackingKey, path, now.minusHours(1))
                : usageLogRepo.countCallsSinceForEndpoint(subId, path, now.minusHours(1));
            if (used >= endpoint.getRateLimitPerHour())
                return RateLimitResult.exceeded("PER_HOUR", endpoint.getRateLimitPerHour(), 3600);
        }
        if (endpoint.getRateLimitPerDay() != null) {
            long used = perClient
                ? usageLogRepo.countCallsSinceByTrackingKeyAndPath(trackingKey, path, now.minusDays(1))
                : usageLogRepo.countCallsSinceForEndpoint(subId, path, now.minusDays(1));
            if (used >= endpoint.getRateLimitPerDay())
                return RateLimitResult.exceeded("PER_DAY", endpoint.getRateLimitPerDay(), 86400);
        }
        if (endpoint.getRateLimitTotal() != null) {
            long used = perClient
                ? usageLogRepo.countTotalCallsByTrackingKeyAndPath(trackingKey, path)
                : usageLogRepo.countTotalCallsForEndpoint(subId, path);
            if (used >= endpoint.getRateLimitTotal())
                return RateLimitResult.exceeded("TOTAL", endpoint.getRateLimitTotal(), 0);
        }
        return RateLimitResult.ok();
    }

    public static class ServiceBlockedException extends RuntimeException {
        public final String reason;
        public ServiceBlockedException(String message, String reason) {
            super(message);
            this.reason = reason;
        }
    }

    public static class EndpointNotPermittedException extends RuntimeException {
        public EndpointNotPermittedException(String message) { super(message); }
    }

    public static class UpstreamUnavailableException extends RuntimeException {
        public final String detail;
        public UpstreamUnavailableException(String message, String detail) {
            super(message);
            this.detail = detail;
        }
    }

}

