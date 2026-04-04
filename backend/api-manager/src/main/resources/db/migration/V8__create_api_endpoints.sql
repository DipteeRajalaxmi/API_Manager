CREATE TABLE IF NOT EXISTS api_endpoints (
    endpoint_id         BIGSERIAL       PRIMARY KEY,
    api_id              BIGINT          NOT NULL REFERENCES apis(api_id) ON DELETE CASCADE,
    method              VARCHAR(10)     NOT NULL,
    path                VARCHAR(255)    NOT NULL,
    description         TEXT,
    request_schema      TEXT,
    response_schema     TEXT,
    is_authenticated    BOOLEAN         DEFAULT TRUE,
    backend_url         TEXT,
    auth_override       VARCHAR(30),
    throttling_tier_id  BIGINT          REFERENCES throttle_policies(tp_id) ON DELETE SET NULL,
    mock_response       JSONB,

    CONSTRAINT chk_method        CHECK (method IN ('GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS')),
    CONSTRAINT chk_auth_override CHECK (auth_override IN ('NONE','API_KEY','OAUTH2','JWT') OR auth_override IS NULL),
    UNIQUE (api_id, method, path)
);

CREATE INDEX idx_api_endpoints_api_id ON api_endpoints(api_id);