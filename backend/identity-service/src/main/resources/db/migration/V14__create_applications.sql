CREATE TABLE applications (
    app_id       SERIAL       PRIMARY KEY,
    developer_id INT          NOT NULL REFERENCES users(user_id)          ON DELETE RESTRICT,
    org_id       INT          REFERENCES organizations(org_id)            ON DELETE SET NULL,
    app_name     VARCHAR(150) NOT NULL,
    description  TEXT,
    callback_url TEXT,                      -- OAuth2 redirect URI
    tier_id      INT          REFERENCES api_plans(plan_id)               ON DELETE SET NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'active',
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_app_status CHECK (status IN ('active','inactive','blocked')),
    UNIQUE (developer_id, app_name)         -- same developer can't have two apps with same name
);

CREATE INDEX idx_applications_developer_id ON applications(developer_id);
CREATE INDEX idx_applications_org_id       ON applications(org_id);
CREATE INDEX idx_applications_status       ON applications(status);




