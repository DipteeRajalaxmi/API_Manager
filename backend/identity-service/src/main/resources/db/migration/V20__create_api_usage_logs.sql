CREATE TABLE api_usage_logs (
    log_id          BIGSERIAL    PRIMARY KEY,   -- BIGSERIAL not SERIAL — millions of rows expected
    api_id          BIGINT          NOT NULL REFERENCES apis(api_id)          ON DELETE CASCADE,
    app_id          BIGINT          REFERENCES applications(app_id)           ON DELETE SET NULL,
    token_id        BIGINT          REFERENCES access_tokens(token_id)        ON DELETE SET NULL,
    request_time    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    method          VARCHAR(10)  NOT NULL,
    endpoint_path   TEXT         NOT NULL,
    response_status BIGINT          NOT NULL,
    latency_ms      BIGINT          NOT NULL,
    ip_address      INET,
    user_agent      TEXT
);

-- Indexes — built on the partition key first for max performance
CREATE INDEX idx_usage_logs_api_id       ON api_usage_logs(api_id, request_time DESC);
CREATE INDEX idx_usage_logs_app_id       ON api_usage_logs(app_id, request_time DESC);
CREATE INDEX idx_usage_logs_status       ON api_usage_logs(response_status);
CREATE INDEX idx_usage_logs_request_time ON api_usage_logs(request_time DESC);