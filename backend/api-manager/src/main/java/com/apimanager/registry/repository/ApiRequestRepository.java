package com.apimanager.registry.repository;

import com.apimanager.registry.entity.ApiRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApiRequestRepository extends JpaRepository<ApiRequest, Long> {

    // Developer: see their own requests
    List<ApiRequest> findBySubmittedBy_UserIdOrderBySubmittedAtDesc(Long userId);

    // Provider: see all requests for their org
    List<ApiRequest> findByOrganization_OrgIdOrderBySubmittedAtDesc(Long orgId);

    // Provider: pending only
    List<ApiRequest> findByOrganization_OrgIdAndStatusOrderBySubmittedAtDesc(Long orgId, String status);

    // count pending for badge
    long countByOrganization_OrgIdAndStatus(Long orgId, String status);
}