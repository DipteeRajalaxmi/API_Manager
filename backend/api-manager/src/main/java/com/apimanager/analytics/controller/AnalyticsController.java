package com.apimanager.analytics.controller;

import com.apimanager.identity.entity.User;
import com.apimanager.identity.repository.UserRepository;
import com.apimanager.portal.repository.ApiUsageLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.apimanager.portal.entity.ApiUsageLog;
import com.apimanager.portal.entity.Subscription;
import com.apimanager.portal.repository.SubscriptionRepository;
import com.apimanager.portal.entity.SubscriptionEndpointPermission;
import com.apimanager.portal.repository.SubscriptionEndpointPermissionRepository;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.*;
import java.time.LocalDate;
import java.time.ZoneId;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final ApiUsageLogRepository usageLogRepo;
    private final UserRepository userRepo;
    private final SubscriptionRepository subscriptionRepo;
    private final SubscriptionEndpointPermissionRepository permissionRepo;


    // ── Provider analytics ────────────────────────────────────────────────────
    @GetMapping("/provider")
    public ResponseEntity<Map<String, Object>> getProviderAnalytics(Authentication auth) {
        User user = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getOrganization() == null)
            return ResponseEntity.ok(Map.of("error", "No organization"));

        Long orgId = user.getOrganization().getOrgId();
        LocalDateTime now = LocalDateTime.now();

        long today = usageLogRepo.countCallsForOrg(orgId, LocalDate.now(ZoneId.of("Asia/Kolkata")).atStartOfDay());
        long week  = usageLogRepo.countCallsForOrg(orgId, now.minusDays(7));
        long month = usageLogRepo.countCallsForOrg(orgId, now.minusDays(30));

        List<Object[]> apiStats = usageLogRepo.apiStatsForOrg(orgId, now.minusDays(7));
        List<Object[]> daily    = usageLogRepo.dailyCallsForOrg(orgId, now.minusDays(7));

        List<Map<String, Object>> apis = new ArrayList<>();
        for (Object[] row : apiStats) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("apiId",      row[0]);
            m.put("apiName",    row[1]);
            m.put("calls",      row[2]);
            m.put("avgLatency", row[3] != null ? Math.round((Double) row[3]) : 0);
            m.put("errors",     row[4]);
            apis.add(m);
        }

        List<Map<String, Object>> dailyCalls = new ArrayList<>();
        for (Object[] row : daily) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date",  row[0].toString());
            m.put("calls", row[1]);
            dailyCalls.add(m);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("callsToday",     today);
        result.put("callsThisWeek",  week);
        result.put("callsThisMonth", month);
        result.put("dailyCalls",     dailyCalls);
        result.put("apiBreakdown",   apis);

        return ResponseEntity.ok(result);
    }

    // ── Developer analytics ───────────────────────────────────────────────────
    @GetMapping("/developer")
    public ResponseEntity<Map<String, Object>> getDeveloperAnalytics(Authentication auth) {
        User user = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime now = LocalDateTime.now();

        long today = usageLogRepo.countCallsForDeveloper(user.getUserId(), 
                        LocalDate.now(ZoneId.of("Asia/Kolkata")).atStartOfDay());
        long week  = usageLogRepo.countCallsForDeveloper(user.getUserId(), now.minusDays(7));
        long month = usageLogRepo.countCallsForDeveloper(user.getUserId(), now.minusDays(30));
        long total = usageLogRepo.countAllCallsForDeveloper(user.getUserId());

        List<Object[]> apiStats = usageLogRepo.apiStatsForDeveloper(user.getUserId(), now.minusDays(30));
        List<Object[]> daily    = usageLogRepo.dailyCallsForDeveloper(user.getUserId(), now.minusDays(30));

        List<Map<String, Object>> apis = new ArrayList<>();
        for (Object[] row : apiStats) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("apiId",      row[0]);
            m.put("apiName",    row[1]);
            m.put("calls",      row[2]);
            m.put("avgLatency", row[3] != null ? Math.round((Double) row[3]) : 0);
            m.put("errors",     row[4]);
            apis.add(m);
        }

        List<Map<String, Object>> dailyCalls = new ArrayList<>();
        for (Object[] row : daily) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date",  row[0].toString());
            m.put("calls", row[1]);
            dailyCalls.add(m);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("callsToday",     today);
        result.put("callsThisWeek",  week);
        result.put("callsThisMonth", month);
        result.put("totalCalls",     total);
        result.put("dailyCalls",     dailyCalls);
        result.put("apiBreakdown",   apis);
        return ResponseEntity.ok(result);
    }


    @GetMapping("/developer/logs")
    public ResponseEntity<Map<String, Object>> getDeveloperLogs(
            @RequestParam(defaultValue = "0") int page,
            Authentication auth) {

        User user = userRepo.findByEmail(auth.getName()).orElseThrow();

        int pageSize = 10;

        List<ApiUsageLog> recentLogs = usageLogRepo.recentLogsForDeveloper(
                user.getUserId(), PageRequest.of(page, pageSize));

        long totalLogs = usageLogRepo.countLogsForDeveloper(user.getUserId());

        // ✅ FIX: create logs list
        List<Map<String, Object>> logs = new ArrayList<>();

        for (ApiUsageLog log : recentLogs) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("requestTime", log.getRequestTime());
            m.put("method", log.getHttpMethod());
            m.put("path", log.getEndpointPath());
            m.put("status", log.getResponseStatus());
            m.put("latency", log.getLatencyMs());
            m.put("rateLimited", log.getWasRateLimited());
            m.put("apiName", log.getApi() != null ? log.getApi().getApiName() : "—");
            logs.add(m);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("logs", logs);
        result.put("totalLogs", totalLogs);
        result.put("currentPage", page);
        result.put("totalPages", (int) Math.ceil((double) totalLogs / pageSize));

        return ResponseEntity.ok(result);
    }

    // ── Provider API detail analytics ─────────────────────────────────────────
    @GetMapping("/provider/api/{apiId}")
    public ResponseEntity<Map<String, Object>> getApiAnalytics(
            @PathVariable Long apiId,@RequestParam(defaultValue = "0") int page, Authentication auth) {

        User user = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getOrganization() == null)
            return ResponseEntity.ok(Map.of("error", "No organization"));

        Long orgId = user.getOrganization().getOrgId();
        LocalDateTime now   = LocalDateTime.now();
        LocalDateTime since = now.minusDays(7);

        List<Object[]>    devStats = usageLogRepo.developerStatsForApi(apiId, since);
        List<ApiUsageLog> recent   = usageLogRepo.recentLogsForApi(apiId,
                org.springframework.data.domain.PageRequest.of(page, 10));
        List<Object[]>    daily    = usageLogRepo.dailyCallsForOrg(orgId, now.minusDays(7));

        List<Map<String, Object>> developers = new ArrayList<>();
        for (Object[] row : devStats) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId",   row[0]);
            m.put("name",     row[1]);
            m.put("calls",    row[2]);
            m.put("lastCall", row[3]);
            developers.add(m);
        }

        List<Map<String, Object>> logs = new ArrayList<>();
        for (ApiUsageLog log : recent) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("requestTime",   log.getRequestTime());
            m.put("method",        log.getHttpMethod());
            m.put("path",          log.getEndpointPath());
            m.put("status",        log.getResponseStatus());
            m.put("latency",       log.getLatencyMs());
            m.put("rateLimited",   log.getWasRateLimited());
            m.put("developerName", log.getDeveloper() != null ? log.getDeveloper().getName() : "—");
            m.put("clientId",   log.getClientId());
            m.put("clientPlan", log.getClientPlan());
            logs.add(m);
        }

        List<Map<String, Object>> dailyCalls = new ArrayList<>();
        for (Object[] row : daily) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date",  row[0].toString());
            m.put("calls", row[1]);
            dailyCalls.add(m);
        }

        long totalLogs = usageLogRepo.countLogsForApi(apiId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("developers", developers);
        result.put("recentLogs", logs);
        result.put("dailyCalls", dailyCalls);
         result.put("totalLogs",   totalLogs);
         result.put("currentPage", page);
         result.put("totalPages",  (int) Math.ceil((double) totalLogs / 10));

        return ResponseEntity.ok(result);
    }

    // Monthly trend — last 12 months
    @GetMapping("/provider/monthly-trend")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyTrend(Authentication auth) {
        User user = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getOrganization() == null) return ResponseEntity.ok(List.of());

        Long orgId = user.getOrganization().getOrgId();
        List<Object[]> rows = usageLogRepo.monthlyCallsForOrg(
                orgId, LocalDateTime.now().minusMonths(12));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", row[0].toString());  
            m.put("calls", row[1]);
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

// Calendar heatmap — daily calls for a given year+month
    @GetMapping("/provider/calendar")
    public ResponseEntity<List<Map<String, Object>>> getCalendarData(
            @RequestParam int year,
            @RequestParam int month,
            Authentication auth) {
        User user = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getOrganization() == null) return ResponseEntity.ok(List.of());

        Long orgId = user.getOrganization().getOrgId();
        LocalDateTime from = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime to   = from.plusMonths(1);

        List<Object[]> rows = usageLogRepo.dailyCallsForOrgInRange(orgId, from, to);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date",  row[0].toString());   // "2026-03-15"
            m.put("calls", row[1]);
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // Top consumers
    @GetMapping("/provider/top-consumers")
    public ResponseEntity<List<Map<String, Object>>> getTopConsumers(
            @RequestParam(defaultValue = "30") int days,
            Authentication auth) {
        User user = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getOrganization() == null) return ResponseEntity.ok(List.of());

        Long orgId = user.getOrganization().getOrgId();
        List<Object[]> rows = usageLogRepo.topConsumersForOrg(
                orgId,
                LocalDateTime.now().minusDays(days),
                org.springframework.data.domain.PageRequest.of(0, 3));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId",   row[0]);
            m.put("name",     row[1]);
            m.put("calls",    row[2]);
            m.put("lastCall", row[3]);
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/provider/developer/{devId}")
    public ResponseEntity<Map<String, Object>> getDeveloperDetail(
            @PathVariable Long devId,
            @RequestParam(defaultValue = "0") int page,
            Authentication auth) {

        User provider = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (provider.getOrganization() == null)
            return ResponseEntity.ok(Map.of("error", "No organization"));

        Long orgId = provider.getOrganization().getOrgId();

        User developer = userRepo.findById(devId)
                .orElseThrow(() -> new RuntimeException("Developer not found"));

        if (developer.getOrganization() == null ||
            !developer.getOrganization().getOrgId().equals(orgId))
            return ResponseEntity.status(403).build();

        LocalDateTime now = LocalDateTime.now();

        long callsToday = usageLogRepo.countCallsForDeveloperSince(devId,
                java.time.LocalDate.now(ZoneId.of("Asia/Kolkata")).atStartOfDay());
        long callsWeek  = usageLogRepo.countCallsForDeveloperSince(devId, now.minusDays(7));

        List<Subscription> subs = subscriptionRepo.findByApplication_Developer_UserId(devId);

        List<Map<String, Object>> subList = new ArrayList<>();
        for (Subscription sub : subs) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("subscriptionId", sub.getSubscriptionId());
            s.put("apiId",          sub.getApi().getApiId());
            s.put("apiName",        sub.getApi().getApiName());
            s.put("apiStatus",      sub.getApi().getStatus());
            s.put("status",         sub.getStatus());
            s.put("subscribedAt",   sub.getCreatedAt());
            s.put("appName",        sub.getApplication().getAppName());

            long subCallsToday = usageLogRepo.countCallsSince(sub.getSubscriptionId(),
                    java.time.LocalDate.now(ZoneId.of("Asia/Kolkata")).atStartOfDay());
            long subCallsWeek  = usageLogRepo.countCallsSince(sub.getSubscriptionId(), now.minusDays(7));
            s.put("callsToday", subCallsToday);
            s.put("callsWeek",  subCallsWeek);

            List<Object[]> epStats = usageLogRepo.endpointStatsForSubscription(
                    sub.getSubscriptionId(), now.minusDays(30));
            List<Map<String, Object>> endpoints = new ArrayList<>();
            for (Object[] row : epStats) {
                Map<String, Object> e = new LinkedHashMap<>();
                e.put("path",      row[0]);
                e.put("method",    row[1]);
                e.put("callCount", row[2]);
                endpoints.add(e);
            }
            s.put("endpoints", endpoints);
            // ── ADD: allowed endpoints + access scope ─────────────────────────────
            boolean hasRestrictions = permissionRepo
                    .existsBySubscription_SubscriptionId(sub.getSubscriptionId());

            List<Map<String, Object>> allowedEndpoints = new ArrayList<>();

            if (hasRestrictions) {
                // restricted — only show the permitted endpoints
                List<SubscriptionEndpointPermission> perms =
                        permissionRepo.findBySubscription_SubscriptionId(sub.getSubscriptionId());
                for (SubscriptionEndpointPermission perm : perms) {
                    Map<String, Object> ep = new LinkedHashMap<>();
                    ep.put("endpointId", perm.getEndpoint().getEndpointId());
                    ep.put("httpMethod", perm.getEndpoint().getHttpMethod());
                    ep.put("path",       perm.getEndpoint().getPath());
                    allowedEndpoints.add(ep);
                }
                s.put("accessScope", "restricted");
            } else {
                // full access — show all endpoints defined on the API
                if (sub.getApi().getEndpoints() != null) {
                    for (var ep : sub.getApi().getEndpoints()) {
                        Map<String, Object> e = new LinkedHashMap<>();
                        e.put("endpointId", ep.getEndpointId());
                        e.put("httpMethod", ep.getHttpMethod());
                        e.put("path",       ep.getPath());
                        allowedEndpoints.add(e);
                    }
                }
                s.put("accessScope", "full");
            }

            s.put("allowedEndpoints", allowedEndpoints);

            subList.add(s);
        }

        int pageSize = 10;
        List<ApiUsageLog> recentLogs = usageLogRepo.recentLogsForDeveloper(devId,
                org.springframework.data.domain.PageRequest.of(page, pageSize));
        long totalLogs = usageLogRepo.countLogsForDeveloper(devId);

        List<Map<String, Object>> logs = new ArrayList<>();
        for (ApiUsageLog log : recentLogs) {
            Map<String, Object> l = new LinkedHashMap<>();
            l.put("requestTime",   log.getRequestTime());
            l.put("method",        log.getHttpMethod());
            l.put("path",          log.getEndpointPath());
            l.put("status",        log.getResponseStatus());
            l.put("statusLabel",   getStatusLabel(log.getResponseStatus(), log.getRateLimitType()));
            l.put("rateLimitType", log.getRateLimitType());
            l.put("latency",       log.getLatencyMs());
            l.put("rateLimited",   log.getWasRateLimited());
            l.put("apiName",       log.getApi() != null ? log.getApi().getApiName() : "—");
            l.put("clientId",   log.getClientId());
            l.put("clientPlan", log.getClientPlan());
            logs.add(l);
        }

        Map<String, Object> devInfo = new LinkedHashMap<>();
        devInfo.put("userId",      developer.getUserId());
        devInfo.put("name",        developer.getName());
        devInfo.put("email",       developer.getEmail());
        devInfo.put("status",      developer.getStatus());
        devInfo.put("lastLoginAt", developer.getLastLoginAt());
        devInfo.put("createdAt",   developer.getCreatedAt());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("developer",    devInfo);
        result.put("callsToday",   callsToday);
        result.put("callsWeek",    callsWeek);
        result.put("subscriptions", subList);
        result.put("recentLogs",   logs);
        result.put("totalLogs",    totalLogs);
        result.put("currentPage",  page);
        result.put("totalPages",   (int) Math.ceil((double) totalLogs / pageSize));

        return ResponseEntity.ok(result);
    }

    private String getStatusLabel(Long status, String rateLimitType) {
            if (status == null) return "Unknown";
            if (status == 200)  return "Success";
            if (status == 201)  return "Created";
            if (status == 204)  return "No Content";
            if (status == 301 || status == 302) return "Redirect";
            if (status == 400)  return "Bad Request";
            if (status == 401)  return "Unauthorized";
            if (status == 403)  return "Forbidden";
            if (status == 404)  return "Not Found";
            if (status == 429) {
                if (rateLimitType != null && rateLimitType.startsWith("ENDPOINT_"))
                    return "Endpoint Rate Limited";
                return "Rate Limited";
            }
            if (status == 500)  return "Server Error";
            if (status == 502)  return "Bad Gateway";
            if (status == 503)  return "Service Unavailable";
            return "HTTP " + status;
        }

}


// @GetMapping("/provider/api/{apiId}")
    // public ResponseEntity<Map<String, Object>> getApiAnalytics(
    //         @PathVariable Long apiId, Authentication auth) {

    //     LocalDateTime now   = LocalDateTime.now();
    //     LocalDateTime since = now.minusDays(7);

    //     List<Object[]> devStats  = usageLogRepo.developerStatsForApi(apiId, since);
    //     List<ApiUsageLog> recent = usageLogRepo.recentLogsForApi(apiId,
    //             org.springframework.data.domain.PageRequest.of(0, 20));

    //     List<Map<String, Object>> developers = new ArrayList<>();
    //     for (Object[] row : devStats) {
    //         Map<String, Object> m = new LinkedHashMap<>();
    //         m.put("userId",    row[0]);
    //         m.put("name",      row[1]);
    //         m.put("calls",     row[2]);
    //         m.put("lastCall",  row[3]);
    //         developers.add(m);
    //     }

    //     List<Object[]> daily = usageLogRepo.dailyCallsForOrg(orgId, now.minusDays(7));

    //     List<Map<String, Object>> dailyCalls = new ArrayList<>();
    //     for (Object[] row : daily) {
    //         Map<String, Object> m = new LinkedHashMap<>();
    //         m.put("date",  row[0].toString());
    //         m.put("calls", row[1]);
    //         dailyCalls.add(m);
    //     }
    //     result.put("dailyCalls", dailyCalls);

    //     List<Map<String, Object>> logs = new ArrayList<>();
    //     for (ApiUsageLog log : recent) {
    //         Map<String, Object> m = new LinkedHashMap<>();
    //         m.put("requestTime",   log.getRequestTime());
    //         m.put("method",        log.getHttpMethod());
    //         m.put("path",          log.getEndpointPath());
    //         m.put("status",        log.getResponseStatus());
    //         m.put("latency",       log.getLatencyMs());
    //         m.put("rateLimited",   log.getWasRateLimited());
    //         m.put("developerName", log.getDeveloper() != null ? log.getDeveloper().getName() : "—");
    //         logs.add(m);
    //     }

    //     Map<String, Object> result = new LinkedHashMap<>();
    //     result.put("developers", developers);
    //     result.put("recentLogs", logs);
    //     return ResponseEntity.ok(result);


       
    // }