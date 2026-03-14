package com.apimanager.registry.entity;

import com.apimanager.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.List;
import com.apimanager.identity.entity.Organization;


@Entity
@Table(name = "apis")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Api {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "api_id")
    private Long apiId;

    @Column(name = "name", nullable = false)
    private String apiName;

    @Column(name = "version", nullable = false)
    private String version;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_url", nullable = false)
    private String baseUrl;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ApiCategory category;

    @Column(name = "lifecycle_state", nullable = false)
    @Builder.Default
    private String status = "draft";

    @Column(name = "visibility")
    @Builder.Default
    private String visibility = "public";

    @Column(name = "auth_type")
    @Builder.Default
    private String authType = "OAUTH2";

    @Column(name = "cors_enabled")
    @Builder.Default
    private Boolean corsEnabled = false;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "api", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ApiEndpoint> endpoints;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id")
    private Organization organization;

    @Column(name = "tags", columnDefinition = "text[]")
    private String[] tags;

    @Column(name = "rate_limit_per_minute")
    private Long rateLimitPerMinute;
 
    @Column(name = "rate_limit_per_hour")
    private Long rateLimitPerHour;
 
    @Column(name = "rate_limit_per_day")
    private Long rateLimitPerDay;
 
    @Column(name = "rate_limit_total")
    private Long rateLimitTotal;
 
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
 
    // @PreUpdate
    // public void onUpdate() { this.updatedAt = LocalDateTime.now(); }
    
}