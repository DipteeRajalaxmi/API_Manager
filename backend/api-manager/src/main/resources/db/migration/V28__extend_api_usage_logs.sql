ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS subscription_id  BIGINT  REFERENCES subscriptions(subscription_id) ON DELETE SET NULL;
ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS developer_id     BIGINT  REFERENCES users(user_id)                 ON DELETE SET NULL;
ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS was_rate_limited BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS rate_limit_type  VARCHAR(20) DEFAULT NULL; -- PER_MINUTE|PER_HOUR|PER_DAY|TOTAL
 
CREATE INDEX IF NOT EXISTS idx_usage_logs_subscription_id ON api_usage_logs(subscription_id, request_time DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_developer_id    ON api_usage_logs(developer_id, request_time DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_rate_limited    ON api_usage_logs(was_rate_limited);