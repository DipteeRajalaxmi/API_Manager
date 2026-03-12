package com.apimanager.portal.entity;

import com.apimanager.identity.entity.Organization;
import com.apimanager.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;


@Entity
@Table(name = "applications",
       uniqueConstraints = @UniqueConstraint(columnNames = {"developer_id", "app_name"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class Application {

     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long appId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "developer_id", nullable = false)
    private User developer;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id")
    private Organization organization;
 
    @Column(name = "app_name", nullable = false)
    private String appName;
 
    @Column(name = "description")
    private String description;
 
    @Column(name = "callback_url")
    private String callbackUrl;
 
    // tier_id references api_plans — null means Basic plan
    @Column(name = "tier_id")
    private Long tierId;
 
    // active | inactive | blocked  (NOT suspended — that's not in the schema)
    @Column(name = "status", nullable = false)
    private String status = "active";
 
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
}
