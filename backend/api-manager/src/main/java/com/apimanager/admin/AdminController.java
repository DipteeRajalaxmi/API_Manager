package com.apimanager.admin.controller;

import com.apimanager.identity.entity.Organization;
import com.apimanager.identity.entity.User;
import com.apimanager.identity.repository.OrganizationRepository;
import com.apimanager.identity.repository.UserRepository;
import com.apimanager.portal.repository.ApiUsageLogRepository;
import com.apimanager.portal.repository.SubscriptionRepository;
import com.apimanager.registry.entity.Api;
import com.apimanager.registry.repository.ApiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.apimanager.gateway.service.IpBlocklistService;


import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository         userRepo;
    private final OrganizationRepository orgRepo;
    private final ApiRepository          apiRepo;
    private final ApiUsageLogRepository  usageLogRepo;
    private final SubscriptionRepository subscriptionRepo;
    private final IpBlocklistService ipBlocklist;


    // ── Platform stats ────────────────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPlatformStats() {
        LocalDateTime now = LocalDateTime.now();

        long totalOrgs          = orgRepo.count();
        long totalUsers         = userRepo.count();
        long totalProviders     = userRepo.countByRole_RoleName("API_PROVIDER");
        long totalDevelopers    = userRepo.countByRole_RoleName("DEVELOPER");
        long totalApis          = apiRepo.countByStatus("published");
        long totalSubscriptions = subscriptionRepo.count();
        long totalCallsToday    = usageLogRepo.countAllCallsSince(now.minusDays(1));
        long totalCallsWeek     = usageLogRepo.countAllCallsSince(now.minusDays(7));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalOrgs",           totalOrgs);
        result.put("totalUsers",          totalUsers);
        result.put("totalProviders",      totalProviders);
        result.put("totalDevelopers",     totalDevelopers);
        result.put("totalApis",           totalApis);
        result.put("totalSubscriptions",  totalSubscriptions);
        result.put("totalCallsToday",     totalCallsToday);
        result.put("totalCallsThisWeek",  totalCallsWeek);

        return ResponseEntity.ok(result);
    }

    // ── All organizations ─────────────────────────────────────────────────────
    @GetMapping("/organizations")
    public ResponseEntity<List<Map<String, Object>>> getAllOrganizations() {
        List<Organization> orgs = orgRepo.findAll();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Organization org : orgs) {
            long devCount = userRepo.countByOrganization_OrgIdAndRole_RoleName(org.getOrgId(), "DEVELOPER");
            long apiCount = apiRepo.countByOrganization_OrgId(org.getOrgId());

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("orgId",          org.getOrgId());
            m.put("orgName",        org.getOrgName());
            m.put("domain",         org.getDomain());
            m.put("status",         org.getStatus());
            m.put("inviteCode",     org.getInviteCode());
            m.put("createdAt",      org.getCreatedAt());
            m.put("developerCount", devCount);
            m.put("apiCount",       apiCount);
            result.add(m);
        }

        return ResponseEntity.ok(result);
    }

    // ── All APIs ──────────────────────────────────────────────────────────────
    @GetMapping("/apis")
    public ResponseEntity<List<Map<String, Object>>> getAllApis() {
        List<Api> apis = apiRepo.findAll();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Api api : apis) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("apiId",      api.getApiId());
            m.put("apiName",    api.getApiName());
            m.put("version",    api.getVersion());
            m.put("status",     api.getStatus());
            m.put("visibility", api.getVisibility());
            m.put("baseUrl",    api.getBaseUrl());
            m.put("orgName",    api.getOrganization() != null ? api.getOrganization().getOrgName() : null);
            m.put("createdAt",  api.getCreatedAt());
            m.put("updatedAt",  api.getUpdatedAt());
            result.add(m);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/blocklist/{ip}")
    public ResponseEntity<Map<String, Object>> blockIp(@PathVariable String ip) {
        ipBlocklist.blockIp(ip);
        return ResponseEntity.ok(Map.of("message", "IP blocked: " + ip));
    }

    @DeleteMapping("/blocklist/{ip}")
    public ResponseEntity<Map<String, Object>> unblockIp(@PathVariable String ip) {
        ipBlocklist.unblockIp(ip);
        return ResponseEntity.ok(Map.of("message", "IP unblocked: " + ip));
    }

    @GetMapping("/blocklist")
    public ResponseEntity<Map<String, Object>> getBlocklist() {
        return ResponseEntity.ok(Map.of("blockedIps", ipBlocklist.getBlockedIps()));
    }
}