package com.apimanager.gateway.service;

import com.apimanager.portal.entity.ApiKey;
import com.apimanager.portal.entity.ApiUsageLog;
import com.apimanager.portal.entity.Subscription;
import com.apimanager.portal.repository.ApiUsageLogRepository;
import com.apimanager.registry.entity.ApiEndpoint;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import com.apimanager.portal.repository.ApiKeyRepository;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncLogService {

    private final ApiUsageLogRepository usageLogRepo;
    private final ApiKeyRepository apiKeyRepo;


    @Async
    public void updateKeyLastUsed(Long keyId) {
        try {
            apiKeyRepo.findById(keyId).ifPresent(key -> {
                key.setLastUsedAt(LocalDateTime.now());
                apiKeyRepo.save(key);
            });
        } catch (Exception e) {
            log.error("Failed to update key last_used_at: {}", e.getMessage());
        }
    }

    @Async
    public void logCall(
            ApiKey apiKey,
            Subscription sub,
            ApiEndpoint endpoint,
            String path,
            String method,
            String ipAddress,
            String userAgent,
            Long status,
            Long latency,
            boolean rateLimited,
            String rateLimitType,
            String clientId,
            String clientPlan,
            String trackingKey) {
        try {
            ApiUsageLog usageLog = new ApiUsageLog();
            usageLog.setApi(sub.getApi());
            usageLog.setApplication(sub.getApplication());
            usageLog.setSubscription(sub);
            usageLog.setDeveloper(sub.getApplication().getDeveloper());
            usageLog.setHttpMethod(method);
            usageLog.setEndpointPath("/" + path);
            usageLog.setResponseStatus(status);
            usageLog.setIpAddress(ipAddress);
            usageLog.setLatencyMs(latency);
            usageLog.setUserAgent(userAgent);
            usageLog.setWasRateLimited(rateLimited);
            usageLog.setRateLimitType(rateLimitType);
            usageLog.setClientId(clientId);
            usageLog.setClientPlan(clientPlan);
            usageLog.setTrackingKey(trackingKey);
            usageLog.setRequestTime(LocalDateTime.now());
            usageLog.setEndpoint(endpoint);
            usageLogRepo.save(usageLog);
        } catch (Exception e) {
            log.error("Async log failed: {}", e.getMessage(), e);
        }
    }
}