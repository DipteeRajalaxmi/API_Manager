package com.apimanager.portal.entity;
import com.apimanager.identity.entity.User;
import com.apimanager.registry.entity.Api;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "api_allowed_developers",
       uniqueConstraints = @UniqueConstraint(columnNames = {"api_id", "developer_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class ApiAllowedDeveloper {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_id", nullable = false)
    private Api api;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "developer_id", nullable = false)
    private User developer;
 
    @Column(name = "added_at", updatable = false)
    private LocalDateTime addedAt = LocalDateTime.now();
    
}
