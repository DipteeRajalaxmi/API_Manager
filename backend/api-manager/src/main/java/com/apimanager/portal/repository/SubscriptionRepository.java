package com.apimanager.portal.repository;

import com.apimanager.portal.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByApplication_AppId(Long appId);

    // all subscriptions across all apps of a developer
    List<Subscription> findByApplication_Developer_UserId(Long developerId);

    // all subscriptions to a specific API (for provider view)
    List<Subscription> findByApi_ApiId(Long apiId);

    Optional<Subscription> findByApplication_AppIdAndApi_ApiId(Long appId, Long apiId);

    boolean existsByApplication_AppIdAndApi_ApiId(Long appId, Long apiId);

    // provider sees all subscriptions to APIs they created
    @Query("SELECT s FROM Subscription s WHERE s.api.createdBy.userId = :providerId")
    List<Subscription> findByApiProvider(@Param("providerId") Long providerId);
}