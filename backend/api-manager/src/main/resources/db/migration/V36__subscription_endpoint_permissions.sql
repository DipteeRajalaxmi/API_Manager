CREATE TABLE subscription_endpoint_permissions (
    permission_id   BIGSERIAL PRIMARY KEY,
    subscription_id BIGINT NOT NULL REFERENCES subscriptions(subscription_id) ON DELETE CASCADE,
    endpoint_id     BIGINT NOT NULL REFERENCES api_endpoints(endpoint_id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(subscription_id, endpoint_id)
);