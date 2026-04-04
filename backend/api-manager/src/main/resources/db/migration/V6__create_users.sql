CREATE TABLE IF NOT EXISTS users (
    user_id       BIGSERIAL       PRIMARY KEY,
    email         VARCHAR(150) NOT NULL UNIQUE,
    name          VARCHAR(100) NOT NULL,
    password_hash TEXT,                        -- NULL when using Keycloak SSO
    role_id       BIGINT          NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    org_id        BIGINT          REFERENCES organizations(org_id)   ON DELETE SET NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'active',
    mfa_enabled   BOOLEAN      NOT NULL DEFAULT false,
    last_login_at TIMESTAMP,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_user_status CHECK (status IN ('active','inactive','banned'))
);

CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_org_id  ON users(org_id);
CREATE INDEX idx_users_status  ON users(status);