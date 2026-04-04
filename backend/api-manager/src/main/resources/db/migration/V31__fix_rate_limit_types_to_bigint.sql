ALTER TABLE apis 
ALTER COLUMN  rate_limit_per_minute TYPE BIGINT,
ALTER COLUMN  rate_limit_per_hour   TYPE BIGINT,
ALTER COLUMN  rate_limit_per_day    TYPE BIGINT,
ALTER COLUMN  rate_limit_total      TYPE BIGINT;