CREATE TABLE organizations (
    org_id     BIGSERIAL       PRIMARY KEY,
    org_name   VARCHAR(150) NOT NULL UNIQUE,
    domain     VARCHAR(100),
    plan_id    BIGINT          REFERENCES api_plans(plan_id) ON DELETE SET NULL,
    invite_code VARCHAR(20) UNIQUE,
    status     VARCHAR(20)  NOT NULL DEFAULT 'active',
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_org_status CHECK (status IN ('active','suspended','deleted'))
);

CREATE INDEX idx_organizations_domain  ON organizations(domain);
CREATE INDEX idx_organizations_status  ON organizations(status);
CREATE INDEX idx_organizations_invite_code ON organizations(invite_code);