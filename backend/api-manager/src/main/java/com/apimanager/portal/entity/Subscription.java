package com.apimanager.portal.entity;
import com.apimanager.identity.entity.Organization;
import com.apimanager.identity.entity.User;
import com.apimanager.registry.entity.Api;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;


@Entity
@Table(name = "subscriptions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"api_id", "app_id"}))
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor

public class Subscription {

     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long subscriptionId;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_id", nullable = false)
    private Api api;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_id", nullable = false)
    private Application application;
 
    @Column(name = "plan_id", nullable = true)
    private Long planId;
 
    // pending | active | blocked | cancelled | rejected
    // We set to "active" directly (auto-approve flow)
    @Column(name = "status", nullable = false)
    private String status = "active";
 
    // set when a provider manually approves (null for auto-approve)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;
 
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
 
    
}
