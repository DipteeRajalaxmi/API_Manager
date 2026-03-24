package com.apimanager.portal.entity;

import com.apimanager.registry.entity.ApiEndpoint;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_endpoint_permissions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"subscription_id", "endpoint_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionEndpointPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long permissionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endpoint_id", nullable = false)
    private ApiEndpoint endpoint;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
