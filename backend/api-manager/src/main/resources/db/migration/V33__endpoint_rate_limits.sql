ALTER TABLE api_endpoints
ADD COLUMN IF NOT EXISTS rate_limit_per_minute BIGINT,
ADD COLUMN IF NOT EXISTS rate_limit_per_hour   BIGINT,
ADD COLUMN IF NOT EXISTS rate_limit_per_day    BIGINT;

-- V33: Track which endpoint was called in usage logs
ALTER TABLE api_usage_logs
ADD COLUMN IF NOT EXISTS endpoint_id BIGINT REFERENCES api_endpoints(endpoint_id);