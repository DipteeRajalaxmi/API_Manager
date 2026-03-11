package com.apimanager.registry.repository;

import com.apimanager.registry.entity.Api;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ApiRepository extends JpaRepository<Api, Long> {

    List<Api> findByStatus(String status);
    List<Api> findByOrganization_OrgId(Long orgId);
    List<Api> findByCreatedBy_UserId(Long userId);
    boolean existsByApiNameAndVersionAndOrganization_OrgId(
        String apiName, String version, Long orgId);

    @Query("""
        SELECT a FROM Api a
        WHERE a.status = 'published'
        AND (:search IS NULL 
             OR LOWER(a.apiName) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(a.description) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:categoryId IS NULL OR a.category.categoryId = :categoryId)
        AND (:orgId IS NULL OR a.organization.orgId = :orgId)
        ORDER BY a.createdAt DESC
    """)
    List<Api> searchPublishedApis(
        @Param("search") String search,
        @Param("categoryId") Long categoryId,
        @Param("orgId") Long orgId
    );
}