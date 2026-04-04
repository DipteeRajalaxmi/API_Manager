CREATE TABLE IF NOT EXISTS apis (
    api_id          BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    base_url        TEXT         NOT NULL,
    version         VARCHAR(20)  NOT NULL DEFAULT 'v1',
    provider_id    BIGINT          NOT NULL REFERENCES users(user_id)           ON DELETE RESTRICT,
    category_id    BIGINT          REFERENCES api_categories(category_id)       ON DELETE SET NULL,
    lifecycle_state VARCHAR(30)  NOT NULL DEFAULT 'draft',
    visibility      VARCHAR(20)  NOT NULL DEFAULT 'public',
    auth_type       VARCHAR(30)  NOT NULL DEFAULT 'OAUTH2',
    cors_enabled    BOOLEAN      NOT NULL DEFAULT false,
    cors_config     JSONB,
    tags            TEXT[],
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP,

    CONSTRAINT chk_lifecycle CHECK (
        lifecycle_state IN ('draft','published','deprecated','retired')
    ),
    CONSTRAINT chk_visibility CHECK (
        visibility IN ('public','private','restricted')
    ),
    CONSTRAINT chk_auth_type CHECK (
        auth_type IN ('NONE','API_KEY','OAUTH2','JWT')
    )
);

CREATE INDEX IF NOT EXISTS idx_apis_provider_id     ON apis(provider_id);
CREATE INDEX IF NOT EXISTS idx_apis_category_id     ON apis(category_id);
CREATE INDEX IF NOT EXISTS idx_apis_lifecycle_state ON apis(lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_apis_visibility      ON apis(visibility);
CREATE INDEX IF NOT EXISTS idx_apis_tags            ON apis USING GIN(tags); 