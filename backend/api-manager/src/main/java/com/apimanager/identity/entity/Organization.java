package com.apimanager.identity.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "organizations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder


public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "org_id")
    private Long orgId;

    @Column(name = "org_name", nullable = false, unique = true)
    private String orgName;

    @Column(name = "domain")
    private String domain;

    @Column(name = "invite_code", unique = true)
    private String inviteCode;

    @Column(name = "status")
    @Builder.Default
    private String status = "active";

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
}
