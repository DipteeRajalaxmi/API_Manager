package com.apimanager.analytics.controller;

import com.apimanager.identity.entity.User;
import com.apimanager.identity.repository.UserRepository;
import com.apimanager.portal.repository.ApiUsageLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.apimanager.portal.entity.ApiUsageLog;

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

        long today = usageLogRepo.countCallsForDeveloper(user.getUserId(), LocalDate.now(ZoneId.of("Asia/Kolkata")).atStartOfDay());
        long week  = usageLogRepo.countCallsForDeveloper(user.getUserId(), now.minusDays(7));

        List<Object[]> apiStats = usageLogRepo.apiStatsForDeveloper(user.getUserId(), now.minusDays(7));

        List<Map<String, Object>> apis = new ArrayList<>();
        for (Object[] row : apiStats) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("apiId",   row[0]);
            m.put("apiName", row[1]);
            m.put("calls",   row[2]);
            apis.add(m);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("callsToday",    today);
        result.put("callsThisWeek", week);
        result.put("apiBreakdown",  apis);

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