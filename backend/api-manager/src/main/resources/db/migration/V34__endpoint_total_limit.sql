ALTER TABLE api_endpoints
ADD COLUMN IF NOT EXISTS rate_limit_total BIGINT;