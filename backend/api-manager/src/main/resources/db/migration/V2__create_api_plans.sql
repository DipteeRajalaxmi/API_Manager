CREATE TABLE IF NOT EXISTS api_plans (
    plan_id       BIGSERIAL          PRIMARY KEY,
    plan_name     VARCHAR(100)    NOT NULL UNIQUE,
    rate_limit    BIGINT             NOT NULL,   -- requests per second
    quota_limit   BIGINT             NOT NULL,   -- requests per day
    billing_cycle VARCHAR(20)     NOT NULL DEFAULT 'monthly',
    price         NUMERIC(10,2)   NOT NULL DEFAULT 0.00,
    description   TEXT,

    CONSTRAINT chk_billing_cycle CHECK (billing_cycle IN ('monthly','yearly','pay-as-you-go')),
    CONSTRAINT chk_rate_limit    CHECK (rate_limit > 0),
    CONSTRAINT chk_quota_limit   CHECK (quota_limit > 0)
);