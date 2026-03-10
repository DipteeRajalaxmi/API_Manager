package com.apimanager.registry.repository;

import com.apimanager.registry.entity.ApiCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;



public interface ApiCategoryRepository extends JpaRepository<ApiCategory, Long>{
     Optional<ApiCategory> findByCategoryName(String categoryName);
}


