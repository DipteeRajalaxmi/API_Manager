CREATE TABLE refresh_tokens (
    rt_id         SERIAL    PRIMARY KEY,
    key_id        INT       NOT NULL REFERENCES api_keys(key_id) ON DELETE CASCADE,
    refresh_token TEXT      NOT NULL UNIQUE,
    expires_at    TIMESTAMP NOT NULL,
    revoked       BOOLEAN   NOT NULL DEFAULT false,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_key_id        ON refresh_tokens(key_id);
CREATE INDEX idx_refresh_tokens_refresh_token ON refresh_tokens(refresh_token);
CREATE INDEX idx_refresh_tokens_expires_at    ON refresh_tokens(expires_at);