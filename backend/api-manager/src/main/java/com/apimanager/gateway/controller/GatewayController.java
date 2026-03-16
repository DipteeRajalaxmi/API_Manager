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
            @RequestBody(required = false) String body,
            HttpMethod method,
            HttpServletRequest request
    ) {
        // ── Extract API key from multiple locations ────────────────────────────
        String apiKey = extractApiKey(request);

        if (apiKey == null || apiKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                        "error", "Missing API key",
                        "hint",  "Provide via X-API-Key header, Authorization: Bearer <key>, or ?api_key= query param"
                    ));
        }

        String fullPath = request.getRequestURI();
        String apiPath  = fullPath.replaceFirst("^/gateway/", "");

        try {
            GatewayResult result = gatewayService.handle(apiKey, apiPath, method, body, request);
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

        } catch (GatewayService.CircuitOpenException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .header("Retry-After", "30")
                    .body(Map.of(
                            "error",   "Service temporarily unavailable",
                            "reason",  "Circuit breaker open — provider backend is down",
                            "retryAfterSeconds", 30
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


    private String extractApiKey(HttpServletRequest request) {
        // Option 1: X-API-Key header
        String key = request.getHeader("X-API-Key");
        if (key != null && !key.isBlank()) return key;

        // Option 2: Authorization: Bearer <key>
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String bearer = auth.substring(7).trim();
            if (!bearer.isBlank()) return bearer;
        }

        // Option 3: ?api_key= query param
        String param = request.getParameter("api_key");
        if (param != null && !param.isBlank()) return param;

        return null;
    }
}
 

