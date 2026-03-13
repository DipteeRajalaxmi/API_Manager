package com.apimanager.registry.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "api_endpoints",
       uniqueConstraints = @UniqueConstraint(columnNames = {"api_id", "method", "path"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiEndpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "endpoint_id")
    private Long endpointId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_id", nullable = false)
    private Api api;

    @Column(name = "method", nullable = false, length = 10)
    private String httpMethod;

    @Column(name = "path", nullable = false, length = 255)
    private String path;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "request_schema", columnDefinition = "TEXT")
    private String requestSchema;

    @Column(name = "response_schema", columnDefinition = "TEXT")
    private String responseSchema;

    @Column(name = "is_authenticated")
    @Builder.Default
    private Boolean isAuthenticated = true;

    // ADDED: these exist in DB, good to have
    @Column(name = "backend_url", columnDefinition = "TEXT")
    private String backendUrl;

    @Column(name = "mock_response", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String mockResponse;

    @Column(name = "auth_override", length = 30)
    private String authOverride;
}