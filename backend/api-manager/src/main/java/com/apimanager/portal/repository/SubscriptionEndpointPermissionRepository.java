package com.apimanager.portal.repository;

import com.apimanager.portal.entity.SubscriptionEndpointPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface SubscriptionEndpointPermissionRepository
        extends JpaRepository<SubscriptionEndpointPermission, Long> {

    // Get all permitted endpoint IDs for a subscription
    @Query("SELECT p.endpoint.endpointId FROM SubscriptionEndpointPermission p " +
           "WHERE p.subscription.subscriptionId = :subId")
    List<Long> findEndpointIdsBySubscriptionId(@Param("subId") Long subId);

    // Check if subscription has ANY endpoint restrictions
    boolean existsBySubscription_SubscriptionId(Long subscriptionId);

    // Check if specific endpoint is permitted
    boolean existsBySubscription_SubscriptionIdAndEndpoint_EndpointId(
        Long subscriptionId, Long endpointId);

    // Delete all permissions for a subscription
    void deleteBySubscription_SubscriptionId(Long subscriptionId);
    List<SubscriptionEndpointPermission> findBySubscription_SubscriptionId(Long subscriptionId);
}
