package com.apimanager.portal.repository;

import com.apimanager.portal.entity.ApiUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

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

    
       // Calls per day for last 7 days (for provider org)
    @Query("SELECT COUNT(l) FROM ApiUsageLog l " +
              "WHERE l.api.organization.orgId = :orgId " +
              "AND l.requestTime >= :since")
       long countCallsForOrg(@Param("orgId") Long orgId,
                            @Param("since") LocalDateTime since);

       // Top APIs by call count for provider
    @Query("SELECT l.api.apiId, l.api.apiName, COUNT(l) as callCount " +
              "FROM ApiUsageLog l " +
              "WHERE l.api.organization.orgId = :orgId " +
              "AND l.requestTime >= :since " +
              "GROUP BY l.api.apiId, l.api.apiName " +
              "ORDER BY callCount DESC")
       List<Object[]> topApisByCallCount(@Param("orgId") Long orgId,
                                   @Param("since") LocalDateTime since);


       @Query("SELECT l.api.apiId, l.api.apiName, COUNT(l), " +
              "AVG(l.latencyMs), SUM(CASE WHEN l.responseStatus >= 400 THEN 1 ELSE 0 END) " +
              "FROM ApiUsageLog l " +
              "WHERE l.api.organization.orgId = :orgId " +
              "AND l.requestTime >= :since " +
              "GROUP BY l.api.apiId, l.api.apiName " +
              "ORDER BY COUNT(l) DESC")
       List<Object[]> apiStatsForOrg(@Param("orgId") Long orgId,
                                   @Param("since") LocalDateTime since);

       @Query("SELECT l.api.apiId, l.api.apiName, COUNT(l) " +
              "FROM ApiUsageLog l " +
              "WHERE l.developer.userId = :devId " +
              "AND l.requestTime >= :since " +
              "GROUP BY l.api.apiId, l.api.apiName " +
              "ORDER BY COUNT(l) DESC")
       List<Object[]> apiStatsForDeveloper(@Param("devId") Long devId,
                                          @Param("since") LocalDateTime since);


       // Per-developer stats for a specific API
       @Query("SELECT l.developer.userId, l.developer.name, " +
              "COUNT(l), MAX(l.requestTime) " +
              "FROM ApiUsageLog l " +
              "WHERE l.api.apiId = :apiId " +
              "AND l.requestTime >= :since " +
              "GROUP BY l.developer.userId, l.developer.name " +
              "ORDER BY COUNT(l) DESC")
       List<Object[]> developerStatsForApi(@Param("apiId") Long apiId,
                                          @Param("since") LocalDateTime since);

       // Recent logs for an API
       @Query("SELECT l FROM ApiUsageLog l " +
              "WHERE l.api.apiId = :apiId " +
              "ORDER BY l.requestTime DESC")
       List<ApiUsageLog> recentLogsForApi(@Param("apiId") Long apiId,
                                          org.springframework.data.domain.Pageable pageable);

       @Query(value = "SELECT DATE(request_time) as day, COUNT(*) as calls " +
               "FROM api_usage_logs " +
               "WHERE api_id IN (SELECT api_id FROM apis WHERE org_id = :orgId) " +
               "AND request_time >= :since " +
               "GROUP BY DATE(request_time) " +
               "ORDER BY day",
              nativeQuery = true)
       List<Object[]> dailyCallsForOrg(@Param("orgId") Long orgId,
                                   @Param("since") java.time.LocalDateTime since);

    @Query("SELECT COUNT(l) FROM ApiUsageLog l " +
           "WHERE l.api.apiId = :apiId " +
           "AND l.requestTime >= :since " +
           "AND l.responseStatus >= 400")
    long countErrorsForApi(@Param("apiId") Long apiId,
                           @Param("since") LocalDateTime since);


     @Query("SELECT COUNT(l) FROM ApiUsageLog l WHERE l.api.apiId = :apiId")
       long countLogsForApi(@Param("apiId") Long apiId);


      @Query("SELECT COUNT(l) FROM ApiUsageLog l WHERE l.requestTime >= :since")
       long countAllCallsSince(@Param("since") LocalDateTime since);


    @Query("SELECT COUNT(l) FROM ApiUsageLog l " +
       "WHERE l.subscription.subscriptionId = :subId " +
       "AND l.endpointPath = :path " +
       "AND l.requestTime >= :since " +
       "AND l.wasRateLimited = false")
    long countCallsSinceForEndpoint(
       @Param("subId")  Long subId,
       @Param("path")   String path,
       @Param("since")  LocalDateTime since);

}