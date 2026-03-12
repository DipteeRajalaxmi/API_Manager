ALTER TABLE api_keys ADD COLUMN subscription_id BIGINT 
    REFERENCES subscriptions(subscription_id) ON DELETE CASCADE;
 
CREATE INDEX idx_api_keys_subscription_id ON api_keys(subscription_id);