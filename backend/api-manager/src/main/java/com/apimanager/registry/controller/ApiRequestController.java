package com.apimanager.registry.controller;

import com.apimanager.registry.service.ApiRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class ApiRequestController {

    private final ApiRequestService requestService;

    // ── Developer endpoints ───────────────────────────────────────────────────

    // Submit new API request
    @PostMapping
    public ResponseEntity<Map<String, Object>> submit(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(requestService.submitRequest(body));
    }

    // Get developer's own requests
    @GetMapping("/my")
    public ResponseEntity<List<Map<String, Object>>> getMyRequests() {
        return ResponseEntity.ok(requestService.getMyRequests());
    }

    // ── Provider endpoints ────────────────────────────────────────────────────

    // Get all org requests (optional ?status=pending filter)
    @GetMapping("/org")
    public ResponseEntity<List<Map<String, Object>>> getOrgRequests(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(requestService.getOrgRequests(status));
    }

    // Approve request → creates API as draft
    @PatchMapping("/{requestId}/approve")
    public ResponseEntity<Map<String, Object>> approve(@PathVariable Long requestId) {
        return ResponseEntity.ok(requestService.approveRequest(requestId));
    }

    // Reject request
    @PatchMapping("/{requestId}/reject")
    public ResponseEntity<Map<String, Object>> reject(
            @PathVariable Long requestId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(requestService.rejectRequest(requestId, body.get("reason")));
    }

    // Request changes
    @PatchMapping("/{requestId}/changes")
    public ResponseEntity<Map<String, Object>> requestChanges(
            @PathVariable Long requestId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(requestService.requestChanges(requestId, body.get("feedback")));
    }

    // Pending count for badge
    @GetMapping("/pending-count")
    public ResponseEntity<Map<String, Object>> pendingCount() {
        return ResponseEntity.ok(Map.of("count", requestService.getPendingCount()));
    }
}