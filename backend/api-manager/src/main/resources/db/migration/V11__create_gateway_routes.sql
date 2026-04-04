CREATE TABLE IF NOT EXISTS gateway_routes (
    route_id     BIGSERIAL       PRIMARY KEY,
    api_id       BIGINT          NOT NULL REFERENCES apis(api_id) ON DELETE CASCADE,
    environment  VARCHAR(20)  NOT NULL DEFAULT 'production',
    endpoint_url TEXT         NOT NULL,
    load_balance BOOLEAN      NOT NULL DEFAULT false,
    failover_url TEXT,
    timeout_ms   BIGINT          NOT NULL DEFAULT 30000,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_environment CHECK (environment IN ('production','sandbox','staging')),
    CONSTRAINT chk_timeout     CHECK (timeout_ms  > 0),
    UNIQUE (api_id, environment)    -- one route per API per environment
);

CREATE INDEX IF NOT EXISTS idx_gateway_routes_api_id      ON gateway_routes(api_id);
CREATE INDEX IF NOT EXISTS idx_gateway_routes_environment ON gateway_routes(environment);