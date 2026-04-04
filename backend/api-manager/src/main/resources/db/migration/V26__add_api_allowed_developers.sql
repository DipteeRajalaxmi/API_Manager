CREATE TABLE IF NOT EXISTS api_allowed_developers (
    id           BIGSERIAL PRIMARY KEY,
    api_id       BIGINT NOT NULL REFERENCES apis(api_id) ON DELETE CASCADE,
    developer_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    added_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (api_id, developer_id)
);
 
CREATE INDEX IF NOT EXISTS idx_api_allowed_dev_api    ON api_allowed_developers(api_id);
CREATE INDEX IF NOT EXISTS idx_api_allowed_dev_user   ON api_allowed_developers(developer_id);