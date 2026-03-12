package com.apimanager.portal.repository;

import com.apimanager.portal.entity.ApiUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface ApiUsageLogRepository extends JpaRepository<ApiUsageLog, Long> {

    // ── Rate limit counters ───────────────────────────────────────────────────
    // Called on every gateway request — subscription scoped, non-rate-limited calls only

    @Query("SELECT COUNT(l) FROM ApiUsageLog l " +
           "WHERE l.subscription.subscriptionId = :subId " +
           "AND l.requestTime >= :since " +
           "AND l.wasRateLimited = false")
    long countCallsSince(@Param("subId") Long subscriptionId,
                         @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(l) FROM ApiUsageLog l " +
           "WHERE l.subscription.subscriptionId = :subId " +
           "AND l.wasRateLimited = false")
    long countTotalCalls(@Param("subId") Long subscriptionId);

    // ── Analytics queries ─────────────────────────────────────────────────────

    @Query("SELECT COUNT(l) FROM ApiUsageLog l " +
           "WHERE l.api.apiId = :apiId AND l.requestTime >= :since")
    long countCallsForApi(@Param("apiId") Long apiId,
                          @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(l) FROM ApiUsageLog l " +
           "WHERE l.developer.userId = :devId AND l.requestTime >= :since")
    long countCallsForDeveloper(@Param("devId") Long developerId,
                                @Param("since") LocalDateTime since);

    @Query("SELECT AVG(l.latencyMs) FROM ApiUsageLog l " +
           "WHERE l.api.apiId = :apiId AND l.requestTime >= :since")
    Double avgLatencyForApi(@Param("apiId") Long apiId,
                            @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(l) FROM ApiUsageLog l " +
           "WHERE l.api.apiId = :apiId " +
           "AND l.requestTime >= :since " +
           "AND l.responseStatus >= 400")
    long countErrorsForApi(@Param("apiId") Long apiId,
                           @Param("since") LocalDateTime since);
}