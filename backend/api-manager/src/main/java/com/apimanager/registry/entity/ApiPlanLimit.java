package com.apimanager.registry.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "api_plan_limits",
       uniqueConstraints = @UniqueConstraint(columnNames = {"api_id", "plan_name"}))

public class ApiPlanLimit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_id", nullable = false)
    private Api api;

    @Column(name = "plan_name", nullable = false)
    private String planName;

    @Column(name = "rate_limit_per_minute")
    private Long rateLimitPerMinute;

    @Column(name = "rate_limit_per_hour")
    private Long rateLimitPerHour;

    @Column(name = "rate_limit_per_day")
    private Long rateLimitPerDay;

    @Column(name = "rate_limit_total")
    private Long rateLimitTotal;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
