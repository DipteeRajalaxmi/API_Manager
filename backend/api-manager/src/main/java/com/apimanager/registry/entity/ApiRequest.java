package com.apimanager.registry.entity;

import com.apimanager.identity.entity.Organization;
import com.apimanager.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "api_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long requestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id")
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    private User submittedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "api_name", nullable = false)
    private String apiName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_url")
    private String baseUrl;

    @Column(name = "visibility")
    @Builder.Default
    private String visibility = "private";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ApiCategory category;

    // endpoints stored as JSON array
    @Column(name = "endpoints", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String endpoints;

    // pending / approved / rejected / changes_requested
    @Column(name = "status")
    @Builder.Default
    private String status = "pending";

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    // set when approved — links to the created API
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_api_id")
    private Api createdApi;

    @CreationTimestamp
    @Column(name = "submitted_at", updatable = false)
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}