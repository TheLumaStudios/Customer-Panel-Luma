-- Create customer_auth table for storing customer panel passwords
-- TEMPORARY: In production, use backend endpoint with Supabase Auth service_role
CREATE TABLE IF NOT EXISTS customer_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password TEXT NOT NULL, -- Plain text password (TEMPORARY - for SMS sending only)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_auth_customer_id ON customer_auth(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_auth_email ON customer_auth(email);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_customer_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_auth_updated_at_trigger ON customer_auth;
CREATE TRIGGER customer_auth_updated_at_trigger
  BEFORE UPDATE ON customer_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_auth_updated_at();

-- Enable RLS
ALTER TABLE customer_auth ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON customer_auth;

-- Allow authenticated admin users to manage customer auth
CREATE POLICY "Allow all operations for authenticated users"
ON customer_auth
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Comments
COMMENT ON TABLE customer_auth IS 'Customer panel authentication (TEMPORARY: Use Supabase Auth in production)';
COMMENT ON COLUMN customer_auth.password IS 'Plain text password for SMS sending - DO NOT USE IN PRODUCTION';
