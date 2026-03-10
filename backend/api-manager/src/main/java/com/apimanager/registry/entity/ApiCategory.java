package com.apimanager.registry.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "api_categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class ApiCategory {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "name", nullable = false, unique = true)
    private String categoryName;

    @Column(name = "description")
    private String description;

    @Column(name = "icon_url")
    private String iconUrl;
    
}
