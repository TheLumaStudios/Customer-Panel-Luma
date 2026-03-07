-- Add WHM/cPanel API credentials to servers table

ALTER TABLE servers
  ADD COLUMN IF NOT EXISTS hostname VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50),
  ADD COLUMN IF NOT EXISTS username VARCHAR(100) DEFAULT 'root',
  ADD COLUMN IF NOT EXISTS api_token TEXT,
  ADD COLUMN IF NOT EXISTS nameserver_1 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS nameserver_2 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS whm_port INTEGER DEFAULT 2087,
  ADD COLUMN IF NOT EXISTS cpanel_port INTEGER DEFAULT 2083,
  ADD COLUMN IF NOT EXISTS max_accounts INTEGER DEFAULT 0; -- 0 = unlimited

-- Comments
COMMENT ON COLUMN servers.hostname IS 'Server hostname (e.g., server1.example.com)';
COMMENT ON COLUMN servers.ip_address IS 'Server IP address';
COMMENT ON COLUMN servers.username IS 'WHM username (usually root)';
COMMENT ON COLUMN servers.api_token IS 'WHM API token for authentication';
COMMENT ON COLUMN servers.nameserver_1 IS 'Primary nameserver (e.g., ns1.example.com)';
COMMENT ON COLUMN servers.nameserver_2 IS 'Secondary nameserver (e.g., ns2.example.com)';
COMMENT ON COLUMN servers.whm_port IS 'WHM port (default 2087)';
COMMENT ON COLUMN servers.cpanel_port IS 'cPanel port (default 2083)';
COMMENT ON COLUMN servers.max_accounts IS 'Maximum accounts allowed on this server (0 = unlimited)';

-- Add index on hostname
CREATE INDEX IF NOT EXISTS idx_servers_hostname ON servers(hostname);
