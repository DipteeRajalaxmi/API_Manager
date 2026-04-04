CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id BIGSERIAL      PRIMARY KEY,
    api_id          BIGINT         NOT NULL REFERENCES apis(api_id)          ON DELETE CASCADE,
    app_id          BIGINT         NOT NULL REFERENCES applications(app_id)  ON DELETE CASCADE,
    plan_id         BIGINT         NOT NULL REFERENCES api_plans(plan_id)    ON DELETE RESTRICT,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by     BIGINT         REFERENCES users(user_id)                 ON DELETE SET NULL,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sub_status CHECK (
        status IN ('pending','active','blocked','cancelled','rejected')
    ),
    UNIQUE (api_id, app_id)     -- one app can only subscribe to an API once
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_api_id  ON subscriptions(api_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_app_id  ON subscriptions(app_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status  ON subscriptions(status);