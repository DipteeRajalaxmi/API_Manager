CREATE TABLE audit_logs (
    audit_id     BIGSERIAL    PRIMARY KEY,   -- BIGSERIAL — high volume expected
    user_id      INT          REFERENCES users(user_id) ON DELETE SET NULL,
    action       VARCHAR(100) NOT NULL,
    resource     VARCHAR(50)  NOT NULL,
    resource_id  INT,
    detail       JSONB,
    ip_address   INET,
    performed_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_audit_resource CHECK (
        resource IN ('api','application','subscription','user',
                     'api_key','policy','deployment','organization')
    )
);

CREATE INDEX idx_audit_logs_user_id      ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action       ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource     ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_performed_at ON audit_logs(performed_at DESC);