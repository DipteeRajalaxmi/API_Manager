package com.apimanager.gateway.service;

import com.apimanager.portal.entity.ApiKey;
import com.apimanager.portal.repository.ApiKeyRepository;
import com.apimanager.registry.entity.ApiPlanLimit;
import com.apimanager.registry.repository.ApiPlanLimitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CachedGatewayDataService {

    private final ApiKeyRepository apiKeyRepo;
    private final ApiPlanLimitRepository apiPlanLimitRepo;

    @Cacheable(value = "apiKeys", key = "#clientId")
    public Optional<ApiKey> findApiKey(String clientId) {
        return apiKeyRepo.findByClientId(clientId);
    }

    @Cacheable(value = "planLimits", key = "#apiId + ':' + #planName")
    public Optional<ApiPlanLimit> findPlanLimit(Long apiId, String planName) {
        return apiPlanLimitRepo.findByApi_ApiIdAndPlanName(apiId, planName);
    }

    @CacheEvict(value = "apiKeys", key = "#clientId")
    public void evictApiKey(String clientId) {}
}