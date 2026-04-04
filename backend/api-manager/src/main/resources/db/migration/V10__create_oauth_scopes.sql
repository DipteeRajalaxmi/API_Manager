CREATE TABLE IF NOT EXISTS oauth_scopes (
    scope_id     BIGSERIAL       PRIMARY KEY,
    api_id       BIGINT          NOT NULL REFERENCES apis(api_id) ON DELETE CASCADE,
    scope_key    VARCHAR(100) NOT NULL UNIQUE,   -- e.g. read:orders, write:payments
    display_name VARCHAR(150),
    description  TEXT
);

CREATE INDEX IF NOT EXISTS idx_oauth_scopes_api_id    ON oauth_scopes(api_id);
CREATE INDEX IF NOT EXISTS idx_oauth_scopes_scope_key ON oauth_scopes(scope_key);