CREATE TABLE subscriptions (
    subscription_id SERIAL      PRIMARY KEY,
    api_id          INT         NOT NULL REFERENCES apis(api_id)          ON DELETE CASCADE,
    app_id          INT         NOT NULL REFERENCES applications(app_id)  ON DELETE CASCADE,
    plan_id         INT         NOT NULL REFERENCES api_plans(plan_id)    ON DELETE RESTRICT,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by     INT         REFERENCES users(user_id)                 ON DELETE SET NULL,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sub_status CHECK (
        status IN ('pending','active','blocked','cancelled','rejected')
    ),
    UNIQUE (api_id, app_id)     -- one app can only subscribe to an API once
);

CREATE INDEX idx_subscriptions_api_id  ON subscriptions(api_id);
CREATE INDEX idx_subscriptions_app_id  ON subscriptions(app_id);
CREATE INDEX idx_subscriptions_status  ON subscriptions(status);