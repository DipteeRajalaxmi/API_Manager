CREATE TABLE IF NOT EXISTS applications (
    app_id       BIGSERIAL       PRIMARY KEY,
    developer_id BIGINT          NOT NULL REFERENCES users(user_id)          ON DELETE RESTRICT,
    org_id       BIGINT          REFERENCES organizations(org_id)            ON DELETE SET NULL,
    app_name     VARCHAR(150) NOT NULL,
    description  TEXT,
    callback_url TEXT,                      -- OAuth2 redirect URI
    tier_id      BIGINT          REFERENCES api_plans(plan_id)               ON DELETE SET NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'active',
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_app_status CHECK (status IN ('active','inactive','blocked')),
    UNIQUE (developer_id, app_name)         -- same developer can't have two apps with same name
);

CREATE INDEX IF NOT EXISTS idx_applications_developer_id ON applications(developer_id);
CREATE INDEX IF NOT EXISTS idx_applications_org_id       ON applications(org_id);
CREATE INDEX IF NOT EXISTS idx_applications_status       ON applications(status);




