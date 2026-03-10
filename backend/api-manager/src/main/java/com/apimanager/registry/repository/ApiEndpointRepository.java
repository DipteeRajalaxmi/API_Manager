package com.apimanager.registry.repository;

import com.apimanager.registry.entity.ApiEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApiEndpointRepository extends JpaRepository<ApiEndpoint, Long>{
    List<ApiEndpoint> findByApi_ApiId(Long apiId);
    
}
