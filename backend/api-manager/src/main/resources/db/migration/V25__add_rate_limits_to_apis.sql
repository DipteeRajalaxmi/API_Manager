ALTER TABLE apis ADD COLUMN rate_limit_per_minute  INT DEFAULT NULL;
ALTER TABLE apis ADD COLUMN rate_limit_per_hour    INT DEFAULT NULL;
ALTER TABLE apis ADD COLUMN rate_limit_per_day     INT DEFAULT NULL;
ALTER TABLE apis ADD COLUMN rate_limit_total       INT DEFAULT NULL;