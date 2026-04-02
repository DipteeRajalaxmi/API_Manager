-- Most critical — rate limit counting per subscription
CREATE INDEX IF NOT EXISTS idx_usage_subscription_time 
ON api_usage_logs(subscription_id, request_time);

-- For plan-based per-client rate limiting (new feature)
CREATE INDEX IF NOT EXISTS idx_usage_tracking_key_time 
ON api_usage_logs(tracking_key, request_time);

-- For endpoint-level rate limiting
CREATE INDEX IF NOT EXISTS idx_usage_sub_path_time 
ON api_usage_logs(subscription_id, endpoint_path, request_time);

-- For provider analytics queries
CREATE INDEX IF NOT EXISTS idx_usage_api_time 
ON api_usage_logs(api_id, request_time);

-- For developer analytics queries
CREATE INDEX IF NOT EXISTS idx_usage_developer_time 
ON api_usage_logs(developer_id, request_time);

-- For org-level analytics
CREATE INDEX IF NOT EXISTS idx_usage_sub_ratelimited
ON api_usage_logs(subscription_id, was_rate_limited, request_time);