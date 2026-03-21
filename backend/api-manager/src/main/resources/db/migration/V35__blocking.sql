ALTER TABLE apis
ADD COLUMN is_blocked BOOLEAN DEFAULT false,
ADD COLUMN blocked_reason TEXT;

ALTER TABLE api_endpoints
ADD COLUMN is_blocked BOOLEAN DEFAULT false,
ADD COLUMN blocked_reason TEXT;