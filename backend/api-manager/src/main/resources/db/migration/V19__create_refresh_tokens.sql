CREATE TABLE IF NOT EXISTS refresh_tokens (
    rt_id         BIGSERIAL    PRIMARY KEY,
    key_id        BIGINT       NOT NULL REFERENCES api_keys(key_id) ON DELETE CASCADE,
    refresh_token TEXT      NOT NULL UNIQUE,
    expires_at    TIMESTAMP NOT NULL,
    revoked       BOOLEAN   NOT NULL DEFAULT false,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_key_id        ON refresh_tokens(key_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_refresh_token ON refresh_tokens(refresh_token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at    ON refresh_tokens(expires_at);