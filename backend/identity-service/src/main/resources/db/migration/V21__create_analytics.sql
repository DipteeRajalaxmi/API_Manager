CREATE TABLE analytics (
    analytic_id         SERIAL  PRIMARY KEY,
    api_id              INT     NOT NULL REFERENCES apis(api_id) ON DELETE CASCADE,
    metric_date         DATE    NOT NULL,
    total_requests      INT     NOT NULL DEFAULT 0,
    successful_requests INT     NOT NULL DEFAULT 0,
    failed_requests     INT     NOT NULL DEFAULT 0,
    avg_latency_ms      INT     NOT NULL DEFAULT 0,
    quota_consumed      INT     NOT NULL DEFAULT 0,

    UNIQUE (api_id, metric_date)    -- one row per API per day, upserted by the analytics job
);

CREATE INDEX idx_analytics_api_id      ON analytics(api_id);
CREATE INDEX idx_analytics_metric_date ON analytics(metric_date DESC);