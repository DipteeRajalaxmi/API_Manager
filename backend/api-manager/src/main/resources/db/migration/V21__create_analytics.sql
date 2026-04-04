CREATE TABLE IF NOT EXISTS analytics (
    analytic_id        BIGSERIAL  PRIMARY KEY,
    api_id              BIGINT     NOT NULL REFERENCES apis(api_id) ON DELETE CASCADE,
    metric_date         DATE    NOT NULL,
    total_requests      BIGINT     NOT NULL DEFAULT 0,
    successful_requests BIGINT     NOT NULL DEFAULT 0,
    failed_requests     BIGINT     NOT NULL DEFAULT 0,
    avg_latency_ms      BIGINT     NOT NULL DEFAULT 0,
    quota_consumed      BIGINT     NOT NULL DEFAULT 0,

    UNIQUE (api_id, metric_date)    -- one row per API per day, upserted by the analytics job
);

CREATE INDEX idx_analytics_api_id      ON analytics(api_id);
CREATE INDEX idx_analytics_metric_date ON analytics(metric_date DESC);