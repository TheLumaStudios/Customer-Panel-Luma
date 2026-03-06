-- Create servers table
CREATE TABLE IF NOT EXISTS servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_name VARCHAR(100) NOT NULL,
  hostname VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,

  -- Server type
  server_type VARCHAR(50) DEFAULT 'cpanel' CHECK (server_type IN ('cpanel', 'plesk', 'directadmin', 'custom')),

  -- Access details
  port INTEGER DEFAULT 2087,
  username VARCHAR(100),
  password TEXT, -- Encrypted in production
  access_hash TEXT,

  -- API settings
  api_token TEXT,
  nameservers JSONB, -- ["ns1.example.com", "ns2.example.com"]

  -- Status
  is_active BOOLEAN DEFAULT true,
  max_accounts INTEGER DEFAULT 0, -- 0 = unlimited

  -- Location
  datacenter VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Türkiye',

  -- Monitoring
  last_checked TIMESTAMP WITH TIME ZONE,
  status_message TEXT,

  -- Notes
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_servers_hostname ON servers(hostname);
CREATE INDEX IF NOT EXISTS idx_servers_ip_address ON servers(ip_address);
CREATE INDEX IF NOT EXISTS idx_servers_is_active ON servers(is_active);
CREATE INDEX IF NOT EXISTS idx_servers_server_type ON servers(server_type);

-- Update hosting table to include server reference and login details
ALTER TABLE hosting
  ADD COLUMN IF NOT EXISTS server_id UUID REFERENCES servers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS username VARCHAR(100),
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS domain VARCHAR(255);

-- Create index
CREATE INDEX IF NOT EXISTS idx_hosting_server_id ON hosting(server_id);

-- Comments
COMMENT ON TABLE servers IS 'Server definitions for hosting';
COMMENT ON COLUMN servers.server_name IS 'Friendly name for the server';
COMMENT ON COLUMN servers.hostname IS 'Server hostname (e.g., server1.example.com)';
COMMENT ON COLUMN servers.ip_address IS 'Server IP address';
COMMENT ON COLUMN servers.server_type IS 'Server control panel type';
COMMENT ON COLUMN servers.port IS 'Connection port (default 2087 for cPanel)';
COMMENT ON COLUMN servers.username IS 'WHM/root username';
COMMENT ON COLUMN servers.password IS 'WHM/root password (encrypted)';
COMMENT ON COLUMN servers.access_hash IS 'WHM access hash for API calls';
COMMENT ON COLUMN servers.api_token IS 'API token for authentication';
COMMENT ON COLUMN servers.nameservers IS 'Nameservers as JSON array';
COMMENT ON COLUMN servers.is_active IS 'Whether server is active and accepting new accounts';
COMMENT ON COLUMN servers.max_accounts IS 'Maximum accounts allowed (0 = unlimited)';
COMMENT ON COLUMN servers.datacenter IS 'Datacenter location';
COMMENT ON COLUMN servers.last_checked IS 'Last health check timestamp';
COMMENT ON COLUMN servers.status_message IS 'Server status message';

COMMENT ON COLUMN hosting.server_id IS 'Reference to server where hosting is located';
COMMENT ON COLUMN hosting.username IS 'cPanel/Hosting username';
COMMENT ON COLUMN hosting.password IS 'cPanel/Hosting password';
COMMENT ON COLUMN hosting.domain IS 'Primary domain for this hosting account';

-- Insert sample servers
INSERT INTO servers (server_name, hostname, ip_address, server_type, port, username, datacenter, country, is_active, nameservers)
VALUES
  ('Server 1 - İstanbul', 'server1.example.com', '185.123.45.67', 'cpanel', 2087, 'root', 'İstanbul DC', 'Türkiye', true, '["ns1.example.com", "ns2.example.com"]'),
  ('Server 2 - Ankara', 'server2.example.com', '185.123.45.68', 'cpanel', 2087, 'root', 'Ankara DC', 'Türkiye', true, '["ns1.example.com", "ns2.example.com"]'),
  ('Server 3 - İzmir', 'server3.example.com', '185.123.45.69', 'plesk', 8443, 'admin', 'İzmir DC', 'Türkiye', true, '["ns1.example.com", "ns2.example.com"]')
ON CONFLICT DO NOTHING;

-- Disable RLS for servers table
ALTER TABLE servers DISABLE ROW LEVEL SECURITY;
GRANT ALL ON servers TO authenticated;
GRANT ALL ON servers TO anon;
