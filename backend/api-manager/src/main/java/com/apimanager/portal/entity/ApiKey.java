package com.apimanager.portal.entity;

import com.apimanager.identity.entity.Organization;
import com.apimanager.identity.entity.User;
import com.apimanager.registry.entity.Api;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Builder
@Table(name = "api_keys")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class ApiKey {

     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long keyId;
 
    // Primary FK — app owns the key
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_id", nullable = false)
    private Application application;
 
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", unique = true)
    private Subscription subscription;
 
    // client_id = public identifier sent in X-API-Key header
    @Column(name = "client_id", nullable = false, unique = true)
    private String clientId;
 
    // client_secret = bcrypt hash stored in DB (never returned in responses)
    @Column(name = "client_secret", nullable = false)
    private String clientSecret;
 
    // PRODUCTION | SANDBOX
    @Column(name = "key_type", nullable = false)
    private String keyType = "PRODUCTION";
 
    // active | revoked | expired
    @Column(name = "status", nullable = false)
    private String status = "active";
 
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
 
    // updated via gateway on each call
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    
}
