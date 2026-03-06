-- Create hosting table (for customer hosting records)
CREATE TABLE IF NOT EXISTS hosting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES hosting_packages(id) ON DELETE SET NULL,
  package_name VARCHAR(100) NOT NULL,
  disk_space_gb INTEGER NOT NULL,
  bandwidth_gb INTEGER,
  start_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  server_location VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hosting_customer_id ON hosting(customer_id);
CREATE INDEX IF NOT EXISTS idx_hosting_package_id ON hosting(package_id);
CREATE INDEX IF NOT EXISTS idx_hosting_expiration_date ON hosting(expiration_date);
CREATE INDEX IF NOT EXISTS idx_hosting_status ON hosting(status);

-- Add comments
COMMENT ON TABLE hosting IS 'Customer hosting records';
COMMENT ON COLUMN hosting.customer_id IS 'Reference to customer';
COMMENT ON COLUMN hosting.package_id IS 'Reference to hosting package definition';
COMMENT ON COLUMN hosting.package_name IS 'Name of the hosting package';
COMMENT ON COLUMN hosting.disk_space_gb IS 'Allocated disk space in GB';
COMMENT ON COLUMN hosting.bandwidth_gb IS 'Monthly bandwidth in GB';
COMMENT ON COLUMN hosting.start_date IS 'Hosting start date';
COMMENT ON COLUMN hosting.expiration_date IS 'Hosting expiration date';
COMMENT ON COLUMN hosting.server_location IS 'Server location (e.g., Istanbul, Turkey)';
COMMENT ON COLUMN hosting.status IS 'Hosting status: active, suspended, expired';

-- Insert sample hosting records
INSERT INTO hosting (customer_id, package_name, disk_space_gb, bandwidth_gb, start_date, expiration_date, server_location, status)
SELECT
  id as customer_id,
  'Basic Hosting' as package_name,
  10 as disk_space_gb,
  100 as bandwidth_gb,
  CURRENT_DATE as start_date,
  CURRENT_DATE + INTERVAL '1 year' as expiration_date,
  'İstanbul, Türkiye' as server_location,
  'active' as status
FROM customers
LIMIT 1
ON CONFLICT DO NOTHING;
