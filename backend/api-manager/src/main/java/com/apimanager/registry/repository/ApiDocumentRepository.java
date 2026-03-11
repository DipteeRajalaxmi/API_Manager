package com.apimanager.registry.repository;

import com.apimanager.registry.entity.ApiDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApiDocumentRepository extends JpaRepository<ApiDocument, Long> {
    List<ApiDocument> findByApi_ApiId(Long apiId);
}