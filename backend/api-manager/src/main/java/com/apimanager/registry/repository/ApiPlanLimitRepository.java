package com.apimanager.registry.repository;

import com.apimanager.registry.entity.ApiPlanLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiPlanLimitRepository extends JpaRepository<ApiPlanLimit, Long> {

    // Get all plan limits for a specific API
    List<ApiPlanLimit> findByApi_ApiId(Long apiId);

    // Get specific plan limit for an API
    Optional<ApiPlanLimit> findByApi_ApiIdAndPlanName(Long apiId, String planName);

    // Check if plan limit exists
    boolean existsByApi_ApiIdAndPlanName(Long apiId, String planName);

    @Modifying
    @Transactional
    void deleteByApi_ApiIdAndPlanName(Long apiId, String planName);

    @Modifying
    @Transactional
    void deleteByApi_ApiId(Long apiId);

 
}
