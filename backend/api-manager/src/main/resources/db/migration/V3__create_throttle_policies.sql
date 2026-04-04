CREATE TABLE IF NOT EXISTS throttle_policies (
    tp_id         BIGSERIAL       PRIMARY KEY,
    policy_name   VARCHAR(100) NOT NULL UNIQUE,
    tier_type     VARCHAR(30)  NOT NULL,   -- APPLICATION / SUBSCRIPTION / API / OPERATION
    request_count BIGINT          NOT NULL,
    unit_time     BIGINT          NOT NULL,   -- window in seconds e.g. 60 = per minute
    stop_on_quota BOOLEAN      NOT NULL DEFAULT true,
    description   TEXT,

    CONSTRAINT chk_tier_type CHECK (
        tier_type IN ('APPLICATION','SUBSCRIPTION','API','OPERATION')
    ),
    CONSTRAINT chk_request_count CHECK (request_count > 0),
    CONSTRAINT chk_unit_time     CHECK (unit_time > 0)
);