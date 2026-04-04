CREATE TABLE IF NOT EXISTS api_keys (
    key_id        BIGSERIAL       PRIMARY KEY,
    app_id        BIGINT          NOT NULL REFERENCES applications(app_id) ON DELETE CASCADE,
    client_id     VARCHAR(200) NOT NULL UNIQUE,
    client_secret TEXT         NOT NULL,    -- stored as bcrypt hash
    key_type      VARCHAR(20)  NOT NULL DEFAULT 'PRODUCTION',
    status        VARCHAR(20)  NOT NULL DEFAULT 'active',
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_key_type   CHECK (key_type IN ('PRODUCTION','SANDBOX')),
    CONSTRAINT chk_key_status CHECK (status   IN ('active','revoked','expired'))
);

CREATE INDEX idx_api_keys_app_id    ON api_keys(app_id);
CREATE INDEX idx_api_keys_client_id ON api_keys(client_id);
CREATE INDEX idx_api_keys_status    ON api_keys(status);