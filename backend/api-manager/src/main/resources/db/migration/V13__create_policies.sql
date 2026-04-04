CREATE TABLE IF NOT EXISTS policies (
    policy_id     BIGSERIAL      PRIMARY KEY,
    api_id        BIGINT         NOT NULL REFERENCES apis(api_id) ON DELETE CASCADE,
    policy_type   VARCHAR(50) NOT NULL,
    scope         VARCHAR(20) NOT NULL DEFAULT 'api',
    policy_config JSONB       NOT NULL DEFAULT '{}',
    policy_order  BIGINT         NOT NULL DEFAULT 1,
    created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_policy_type CHECK (
        policy_type IN ('rate_limit','quota','ip_filter','caching','cors',
                        'header_transform','jwt_validate','request_size_limit','logging')
    ),
    CONSTRAINT chk_policy_scope CHECK (scope IN ('global','api','operation'))
);

CREATE INDEX idx_policies_api_id      ON policies(api_id);
CREATE INDEX idx_policies_policy_type ON policies(policy_type);