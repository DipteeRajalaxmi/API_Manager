package com.apimanager.registry.repository;

import com.apimanager.registry.entity.Api;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApiRepository extends JpaRepository<Api, Long> {

    List<Api> findByStatus(String status);
    List<Api> findByCreatedBy_UserId(Long userId);
    boolean existsByApiNameAndVersion(String apiName, String version);
}