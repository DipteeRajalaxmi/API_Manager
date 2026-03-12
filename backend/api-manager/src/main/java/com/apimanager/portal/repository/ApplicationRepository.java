package com.apimanager.portal.repository;

import com.apimanager.portal.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByDeveloper_UserIdAndOrganization_OrgId(Long developerId, Long orgId);

    List<Application> findByOrganization_OrgId(Long orgId);

    boolean existsByDeveloper_UserIdAndAppName(Long developerId, String appName);
}