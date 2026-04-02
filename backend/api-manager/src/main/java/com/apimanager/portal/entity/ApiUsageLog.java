package com.apimanager.portal.entity;
import com.apimanager.identity.entity.Organization;
import com.apimanager.identity.entity.User;
import com.apimanager.registry.entity.Api;
import jakarta.persistence.*;
import lombok.*;
import com.apimanager.registry.entity.ApiEndpoint;
 
import java.time.LocalDateTime;
 
@Entity
@Table(name = "api_usage_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class ApiUsageLog {
     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;
  
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_id", nullable = false)
    private Api api;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_id")
    private Application application;
 
    // token_id can be null for API key auth
    @Column(name = "token_id")
    private Long tokenId;
 
    @Column(name = "request_time", updatable = false)
    private LocalDateTime requestTime = LocalDateTime.now();
 
    @Column(name = "method", nullable = false)
    private String httpMethod;
 
    @Column(name = "endpoint_path", nullable = false)
    private String endpointPath;
 
    @Column(name = "response_status", nullable = false)
    private Long  responseStatus;
 
    @Column(name = "latency_ms", nullable = false)
    private Long  latencyMs;
 
    @Column(name = "ip_address", columnDefinition = "text")
    private String ipAddress;
 
    @Column(name = "user_agent")
    private String userAgent;
  
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id")
    private Subscription subscription;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "developer_id")
    private User developer;
 
    // true if this request was rejected due to rate limiting
    @Column(name = "was_rate_limited")
    private Boolean wasRateLimited = false;
 
    // which limit was hit: PER_MINUTE | PER_HOUR | PER_DAY | TOTAL | null
    @Column(name = "rate_limit_type")
    private String rateLimitType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endpoint_id")
    private ApiEndpoint endpoint;

    @Column(name = "client_id")
    private String clientId;

    @Column(name = "client_plan")
    private String clientPlan;

    @Column(name = "tracking_key")
    private String trackingKey;

   
}
