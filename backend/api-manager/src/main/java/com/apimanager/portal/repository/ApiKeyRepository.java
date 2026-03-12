package com.apimanager.portal.repository;

import com.apimanager.portal.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {

    // used by gateway to validate incoming X-API-Key header
    Optional<ApiKey> findByClientIdAndStatus(String clientId, String status);

    Optional<ApiKey> findByClientId(String clientId);

    // one key per subscription
    Optional<ApiKey> findBySubscription_SubscriptionId(Long subscriptionId);

    List<ApiKey> findByApplication_AppId(Long appId);

    List<ApiKey> findByApplication_Developer_UserId(Long developerId);
}