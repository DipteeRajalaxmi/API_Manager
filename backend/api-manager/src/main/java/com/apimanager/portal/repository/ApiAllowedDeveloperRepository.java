package com.apimanager.portal.repository;

import com.apimanager.portal.entity.ApiAllowedDeveloper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ApiAllowedDeveloperRepository extends JpaRepository<ApiAllowedDeveloper, Long> {

    List<ApiAllowedDeveloper> findByApi_ApiId(Long apiId);

    boolean existsByApi_ApiIdAndDeveloper_UserId(Long apiId, Long developerId);

    @Transactional
    void deleteByApi_ApiIdAndDeveloper_UserId(Long apiId, Long developerId);

    @Transactional
    void deleteByApi_ApiId(Long apiId);
}