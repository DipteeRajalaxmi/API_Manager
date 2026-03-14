package com.apimanager.gateway.controller;
 
import com.apimanager.gateway.service.GatewayService;
import com.apimanager.gateway.service.GatewayService.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
import java.util.Map;
 
@Slf4j
@RestController
@RequestMapping("/gateway")
@RequiredArgsConstructor

public class GatewayController {

    private final GatewayService gatewayService;

     @RequestMapping("/**")
    public ResponseEntity<Object> proxy(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @RequestBody(required = false) String body,
            HttpMethod method,
            HttpServletRequest request
    ) {
        // ── 1. API key required ───────────────────────────────────────────────
        if (apiKey == null || apiKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing X-API-Key header"));
        }
 
        // ── 2. Extract the path after /gateway/ ───────────────────────────────
        String fullPath  = request.getRequestURI(); // e.g. /gateway/my-api/v1/users
        String apiPath   = fullPath.replaceFirst("^/gateway/", ""); // e.g. my-api/v1/users
 
        try {
            GatewayResult result = gatewayService.handle(apiKey, apiPath, method, body, request);
 
            // ── 3. Build response with upstream body + rate limit headers ─────
            return ResponseEntity
                    .status(result.upstream().getStatusCode())
                    .headers(h -> addRateLimitHeaders(h, result.rateLimitHeaders()))
                    .body(result.upstream().getBody());
 
        } catch (GatewayService.GatewayAuthException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
 
        } catch (GatewayService.RateLimitException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(e.retryAfterSeconds))
                    .body(Map.of(
                            "error",             "Rate limit exceeded",
                            "limitType",         e.limitType,
                            "limit",             e.limit,
                            "remaining",         0,
                            "retryAfterSeconds", e.retryAfterSeconds
                    ));
 
        } catch (Exception e) {
            log.error("Gateway error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", "Gateway error: " + e.getMessage()));
        }
    }
 
    private void addRateLimitHeaders(org.springframework.http.HttpHeaders h,
                                      RateLimitHeaders rl) {
        if (rl == null) return;
        if (rl.limitMinute     != null) h.set("X-RateLimit-Limit-Minute",      String.valueOf(rl.limitMinute));
        if (rl.remainingMinute != null) h.set("X-RateLimit-Remaining-Minute",  String.valueOf(rl.remainingMinute));
        if (rl.limitHour       != null) h.set("X-RateLimit-Limit-Hour",        String.valueOf(rl.limitHour));
        if (rl.remainingHour   != null) h.set("X-RateLimit-Remaining-Hour",    String.valueOf(rl.remainingHour));
        if (rl.limitDay        != null) h.set("X-RateLimit-Limit-Day",         String.valueOf(rl.limitDay));
        if (rl.remainingDay    != null) h.set("X-RateLimit-Remaining-Day",     String.valueOf(rl.remainingDay));
        if (rl.limitTotal      != null) h.set("X-RateLimit-Limit-Total",       String.valueOf(rl.limitTotal));
        if (rl.remainingTotal  != null) h.set("X-RateLimit-Remaining-Total",   String.valueOf(rl.remainingTotal));
    }
}
 

