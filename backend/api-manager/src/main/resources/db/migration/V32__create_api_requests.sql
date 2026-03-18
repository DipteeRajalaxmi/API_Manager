CREATE TABLE api_requests (
    request_id       BIGSERIAL PRIMARY KEY,
    org_id           BIGINT REFERENCES organizations(org_id),
    submitted_by     BIGINT REFERENCES users(user_id),
    reviewed_by      BIGINT REFERENCES users(user_id),
    api_name         VARCHAR(100) NOT NULL,
    description      TEXT,
    base_url         VARCHAR(500),
    visibility       VARCHAR(20)  DEFAULT 'private',
    category_id      BIGINT REFERENCES api_categories(category_id),
    endpoints        JSONB,
    status           VARCHAR(30)  DEFAULT 'pending',
    rejection_reason TEXT,
    feedback         TEXT,
    created_api_id   BIGINT REFERENCES apis(api_id),
    submitted_at     TIMESTAMP    DEFAULT NOW(),
    reviewed_at      TIMESTAMP
);