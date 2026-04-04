CREATE TABLE IF NOT EXISTS token_scopes (
    token_id BIGINT NOT NULL REFERENCES access_tokens(token_id) ON DELETE CASCADE,
    scope_id BIGINT NOT NULL REFERENCES oauth_scopes(scope_id)  ON DELETE CASCADE,
    PRIMARY KEY (token_id, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_token_scopes_token_id ON token_scopes(token_id);
CREATE INDEX IF NOT EXISTS idx_token_scopes_scope_id ON token_scopes(scope_id);