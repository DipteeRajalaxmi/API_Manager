-- Drop existing constraint
ALTER TABLE api_usage_logs 
DROP CONSTRAINT IF EXISTS api_usage_logs_endpoint_id_fkey;

-- Re-add with SET NULL so deleting endpoint doesn't block
ALTER TABLE api_usage_logs 
ADD CONSTRAINT api_usage_logs_endpoint_id_fkey 
FOREIGN KEY (endpoint_id) 
REFERENCES api_endpoints(endpoint_id) 
ON DELETE SET NULL;