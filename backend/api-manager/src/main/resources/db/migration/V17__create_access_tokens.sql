CREATE TABLE access_tokens (
    token_id     BIGSERIAL      PRIMARY KEY,
    key_id       BIGINT         NOT NULL REFERENCES api_keys(key_id) ON DELETE CASCADE,
    access_token TEXT        NOT NULL UNIQUE,
    grant_type   VARCHAR(30) NOT NULL DEFAULT 'client_credentials',
    expires_at   TIMESTAMP   NOT NULL,
    revoked      BOOLEAN     NOT NULL DEFAULT false,
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_grant_type CHECK (
        grant_type IN ('client_credentials','authorization_code','password','refresh_token')
    )
);

CREATE INDEX idx_access_tokens_key_id       ON access_tokens(key_id);
CREATE INDEX idx_access_tokens_access_token ON access_tokens(access_token);
CREATE INDEX idx_access_tokens_expires_at   ON access_tokens(expires_at);  -- for expiry cleanup jobs




