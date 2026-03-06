-- Create VDS/VPS table for virtual server management
CREATE TABLE IF NOT EXISTS vds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id) ON DELETE SET NULL,

  -- Basic Info
  vds_name VARCHAR(255) NOT NULL,
  vds_type VARCHAR(50) DEFAULT 'VDS' CHECK (vds_type IN ('VDS', 'VPS', 'Dedicated')),

  -- Server Specs
  cpu_cores INTEGER NOT NULL DEFAULT 1,
  ram_gb INTEGER NOT NULL DEFAULT 1,
  disk_space_gb INTEGER NOT NULL DEFAULT 20,
  bandwidth_gb INTEGER DEFAULT -1, -- -1 = unlimited

  -- Network
  ip_address VARCHAR(45),
  additional_ips TEXT[], -- Array of additional IPs

  -- OS & Software
  operating_system VARCHAR(100),
  control_panel VARCHAR(50), -- 'cPanel', 'Plesk', 'DirectAdmin', 'None'

  -- Access
  username VARCHAR(100),
  password TEXT,
  root_password TEXT,

  -- Dates
  start_date DATE,
  expiration_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired', 'terminated')),

  -- Pricing
  monthly_price DECIMAL(10, 2) DEFAULT 0,
  setup_fee DECIMAL(10, 2) DEFAULT 0,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vds_customer_id ON vds(customer_id);
CREATE INDEX IF NOT EXISTS idx_vds_server_id ON vds(server_id);
CREATE INDEX IF NOT EXISTS idx_vds_status ON vds(status);
CREATE INDEX IF NOT EXISTS idx_vds_expiration_date ON vds(expiration_date);
CREATE INDEX IF NOT EXISTS idx_vds_ip_address ON vds(ip_address);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_vds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vds_updated_at_trigger ON vds;
CREATE TRIGGER vds_updated_at_trigger
  BEFORE UPDATE ON vds
  FOR EACH ROW
  EXECUTE FUNCTION update_vds_updated_at();

-- Comments
COMMENT ON TABLE vds IS 'VDS/VPS virtual server management';
COMMENT ON COLUMN vds.vds_type IS 'Server type: VDS, VPS, or Dedicated';
COMMENT ON COLUMN vds.bandwidth_gb IS 'Monthly bandwidth in GB (-1 = unlimited)';
COMMENT ON COLUMN vds.additional_ips IS 'Array of additional IP addresses';
COMMENT ON COLUMN vds.control_panel IS 'Installed control panel software';
COMMENT ON COLUMN vds.start_date IS 'VDS start date (NULL = unlimited)';
COMMENT ON COLUMN vds.expiration_date IS 'VDS expiration date (NULL = unlimited)';
