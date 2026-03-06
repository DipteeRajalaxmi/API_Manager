CREATE TABLE alert_subscriptions (
    alert_id        SERIAL        PRIMARY KEY,
    user_id         INT           NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    api_id          INT           NOT NULL REFERENCES apis(api_id)   ON DELETE CASCADE,
    alert_type      VARCHAR(50)   NOT NULL,
    threshold_value NUMERIC(10,2) NOT NULL,
    notify_email    TEXT,
    notify_webhook  TEXT,
    enabled         BOOLEAN       NOT NULL DEFAULT true,

    CONSTRAINT chk_alert_type CHECK (
        alert_type IN ('ERROR_RATE','HIGH_LATENCY','QUOTA_80_PERCENT','QUOTA_EXHAUSTED','API_DOWN')
    ),
    CONSTRAINT chk_notify CHECK (
        notify_email IS NOT NULL OR notify_webhook IS NOT NULL
    )   -- must have at least one notification channel
);

CREATE INDEX idx_alert_subscriptions_user_id ON alert_subscriptions(user_id);
CREATE INDEX idx_alert_subscriptions_api_id  ON alert_subscriptions(api_id);
CREATE INDEX idx_alert_subscriptions_enabled ON alert_subscriptions(enabled);