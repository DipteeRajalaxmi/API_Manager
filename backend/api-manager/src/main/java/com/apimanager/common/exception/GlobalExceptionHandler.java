package com.apimanager.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Handle validation errors (@Valid failures)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fieldErrors.put(error.getField(), error.getDefaultMessage()));

        return ResponseEntity.badRequest().body(buildError(
                HttpStatus.BAD_REQUEST, "Validation failed", fieldErrors));
    }


    // ── Gateway-specific exceptions ───────────────────────────────────────────

    @ExceptionHandler(com.apimanager.gateway.service.GatewayService.GatewayAuthException.class)
    public ResponseEntity<Map<String, Object>> handleGatewayAuth(
            com.apimanager.gateway.service.GatewayService.GatewayAuthException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(buildError(HttpStatus.UNAUTHORIZED, ex.getMessage(), null));
    }

    @ExceptionHandler(com.apimanager.gateway.service.GatewayService.RateLimitException.class)
    public ResponseEntity<Map<String, Object>> handleRateLimit(
            com.apimanager.gateway.service.GatewayService.RateLimitException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(buildError(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage(), null));
    }

    @ExceptionHandler(com.apimanager.gateway.service.GatewayService.CircuitOpenException.class)
    public ResponseEntity<Map<String, Object>> handleCircuitOpen(
            com.apimanager.gateway.service.GatewayService.CircuitOpenException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(buildError(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), null));
    }

    @ExceptionHandler(com.apimanager.gateway.service.GatewayService.ServiceBlockedException.class)
    public ResponseEntity<Map<String, Object>> handleServiceBlocked(
            com.apimanager.gateway.service.GatewayService.ServiceBlockedException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(buildError(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), null));
    }

    @ExceptionHandler(com.apimanager.gateway.service.GatewayService.EndpointNotPermittedException.class)
    public ResponseEntity<Map<String, Object>> handleEndpointNotPermitted(
            com.apimanager.gateway.service.GatewayService.EndpointNotPermittedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(buildError(HttpStatus.FORBIDDEN, ex.getMessage(), null));
    }

    @ExceptionHandler(com.apimanager.gateway.service.GatewayService.UpstreamUnavailableException.class)
    public ResponseEntity<Map<String, Object>> handleUpstreamUnavailable(
            com.apimanager.gateway.service.GatewayService.UpstreamUnavailableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(buildError(HttpStatus.BAD_GATEWAY, "Upstream unreachable", ex.detail));
    }

    @ExceptionHandler(com.apimanager.common.exception.ApiManagerException.class)
    public ResponseEntity<Map<String, Object>> handleApiManagerException(
            com.apimanager.common.exception.ApiManagerException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildError(HttpStatus.BAD_REQUEST, ex.getMessage(), null));
    }

        // Handle business logic errors (RuntimeException)
        @ExceptionHandler(RuntimeException.class)
        public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";

        if (msg.contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(buildError(HttpStatus.NOT_FOUND, ex.getMessage(), null));
        }
        if (msg.contains("not authorized") || msg.contains("unauthorized") || msg.contains("not your")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(buildError(HttpStatus.FORBIDDEN, ex.getMessage(), null));
        }
        if (msg.contains("already exists") || msg.contains("already subscribed") || msg.contains("duplicate")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(buildError(HttpStatus.CONFLICT, ex.getMessage(), null));
        }
        if (msg.contains("only") || msg.contains("cannot") || msg.contains("must")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(buildError(HttpStatus.BAD_REQUEST, ex.getMessage(), null));
        }

        // log unexpected ones
        System.err.println("[GlobalExceptionHandler] Unhandled RuntimeException: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildError(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", null));
        }

    // Handle anything else unexpected
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildError(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), null));
    }

    private Map<String, Object> buildError(HttpStatus status, String message, Object details) {
        Map<String, Object> error = new HashMap<>();
        error.put("timestamp", LocalDateTime.now().toString());
        error.put("status", status.value());
        error.put("error", message);
        if (details != null) error.put("details", details);
        return error;
    }
}