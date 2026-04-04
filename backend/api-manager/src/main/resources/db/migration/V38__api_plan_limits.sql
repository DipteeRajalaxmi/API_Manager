-- New table for per-API plan limits
CREATE TABLE IF NOT EXISTS api_plan_limits (
  id BIGSERIAL PRIMARY KEY,
  api_id BIGINT NOT NULL REFERENCES apis(api_id) ON DELETE CASCADE,
  plan_name VARCHAR(50) NOT NULL,
  rate_limit_per_minute BIGINT,
  rate_limit_per_hour BIGINT,
  rate_limit_per_day BIGINT,
  rate_limit_total BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(api_id, plan_name)
);

-- Add client tracking to usage logs
ALTER TABLE api_usage_logs ADD COLUMN client_id VARCHAR(255);
ALTER TABLE api_usage_logs ADD COLUMN client_plan VARCHAR(100);
ALTER TABLE api_usage_logs ADD COLUMN tracking_key VARCHAR(500);