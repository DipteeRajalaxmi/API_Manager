CREATE TABLE api_deployments (
    deploy_id    SERIAL       PRIMARY KEY,
    api_id       INT          NOT NULL REFERENCES apis(api_id)   ON DELETE CASCADE,
    gateway_node VARCHAR(100) NOT NULL,
    environment  VARCHAR(20)  NOT NULL DEFAULT 'production',
    deployed_by  INT          NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    deployed_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status       VARCHAR(20)  NOT NULL DEFAULT 'active',

    CONSTRAINT chk_deploy_env    CHECK (environment IN ('production','sandbox','staging')),
    CONSTRAINT chk_deploy_status CHECK (status      IN ('active','rolled_back','failed'))
);

CREATE INDEX idx_api_deployments_api_id      ON api_deployments(api_id);
CREATE INDEX idx_api_deployments_deployed_by ON api_deployments(deployed_by);
CREATE INDEX idx_api_deployments_status      ON api_deployments(status);