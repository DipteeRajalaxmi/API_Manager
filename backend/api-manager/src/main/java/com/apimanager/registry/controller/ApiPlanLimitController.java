package com.apimanager.registry.controller;

import com.apimanager.registry.entity.Api;
import com.apimanager.registry.entity.ApiPlanLimit;
import com.apimanager.registry.repository.ApiPlanLimitRepository;
import com.apimanager.registry.repository.ApiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/registry/apis/{apiId}/plan-limits")
@RequiredArgsConstructor
public class ApiPlanLimitController {

    private final ApiPlanLimitRepository planLimitRepo;
    private final ApiRepository apiRepo;

    // ── Get all plan limits for an API ────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<ApiPlanLimitResponse>> getPlanLimits(@PathVariable Long apiId) {
        return ResponseEntity.ok(
            planLimitRepo.findByApi_ApiId(apiId)
                         .stream()
                         .map(this::toResponse)
                         .toList()
        );
    }

    // ── Create or update a plan limit ─────────────────────────────────────────
    @PostMapping
    public ResponseEntity<ApiPlanLimitResponse> savePlanLimit(
            @PathVariable Long apiId,
            @RequestBody ApiPlanLimitRequest request) {

        Api api = apiRepo.findById(apiId)
                .orElseThrow(() -> new RuntimeException("API not found"));

        ApiPlanLimit planLimit = planLimitRepo
                .findByApi_ApiIdAndPlanName(apiId, request.planName().toLowerCase())
                .orElse(new ApiPlanLimit());

        planLimit.setApi(api);
        planLimit.setPlanName(request.planName().toLowerCase());
        planLimit.setRateLimitPerMinute(request.rateLimitPerMinute());
        planLimit.setRateLimitPerHour(request.rateLimitPerHour());
        planLimit.setRateLimitPerDay(request.rateLimitPerDay());
        planLimit.setRateLimitTotal(request.rateLimitTotal());

        return ResponseEntity.ok(toResponse(planLimitRepo.save(planLimit)));
    }

    // ── Delete a specific plan limit ──────────────────────────────────────────
    @DeleteMapping("/{planName}")
    public ResponseEntity<?> deletePlanLimit(
            @PathVariable Long apiId,
            @PathVariable String planName) {
        planLimitRepo.deleteByApi_ApiIdAndPlanName(apiId, planName.toLowerCase());
        return ResponseEntity.ok(Map.of("message", "Plan limit deleted"));
    }

    // ── Delete all plan limits for an API ─────────────────────────────────────
    @DeleteMapping
    public ResponseEntity<?> deleteAllPlanLimits(@PathVariable Long apiId) {
        planLimitRepo.deleteByApi_ApiId(apiId);
        return ResponseEntity.ok(Map.of("message", "All plan limits deleted"));
    }

    // ── Mapper ────────────────────────────────────────────────────────────────
    private ApiPlanLimitResponse toResponse(ApiPlanLimit p) {
        return new ApiPlanLimitResponse(
            p.getId(),
            p.getPlanName(),
            p.getRateLimitPerMinute(),
            p.getRateLimitPerHour(),
            p.getRateLimitPerDay(),
            p.getRateLimitTotal()
        );
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────
    public record ApiPlanLimitRequest(
        String planName,
        Long rateLimitPerMinute,
        Long rateLimitPerHour,
        Long rateLimitPerDay,
        Long rateLimitTotal
    ) {}

    public record ApiPlanLimitResponse(
        Long id,
        String planName,
        Long rateLimitPerMinute,
        Long rateLimitPerHour,
        Long rateLimitPerDay,
        Long rateLimitTotal
    ) {}
}