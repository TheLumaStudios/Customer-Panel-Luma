-- Customer Addresses Migration
-- Multiple addresses per customer (billing, shipping, etc.)

-- Create customer_addresses table
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Address Type
  type VARCHAR(20) NOT NULL DEFAULT 'billing', -- billing, shipping, other
  label VARCHAR(100), -- e.g., "Ev Adresi", "İş Adresi"
  is_default BOOLEAN DEFAULT false,

  -- Contact Info
  contact_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),

  -- Address Details
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Turkey',

  -- Turkish ID (for invoicing)
  tax_office VARCHAR(100), -- Vergi dairesi
  tax_number VARCHAR(50), -- Vergi numarası
  identity_number VARCHAR(11), -- TC kimlik no

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_type ON customer_addresses(type);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(customer_id, is_default) WHERE is_default = true;

-- Trigger to update updated_at
CREATE OR REPLACE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view their own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can create their own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can update their own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can delete their own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Admins can view all addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Admins can manage all addresses" ON customer_addresses;

-- Customers can view their own addresses
CREATE POLICY "Customers can view their own addresses" ON customer_addresses
  FOR SELECT
  USING (
    auth.uid() = customer_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Customers can create their own addresses
CREATE POLICY "Customers can create their own addresses" ON customer_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own addresses
CREATE POLICY "Customers can update their own addresses" ON customer_addresses
  FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Customers can delete their own addresses
CREATE POLICY "Customers can delete their own addresses" ON customer_addresses
  FOR DELETE
  USING (auth.uid() = customer_id);

-- Admins can view all addresses
CREATE POLICY "Admins can view all addresses" ON customer_addresses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can manage all addresses
CREATE POLICY "Admins can manage all addresses" ON customer_addresses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to ensure only one default address per type per customer
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new/updated address is set as default
  IF NEW.is_default = true THEN
    -- Unset all other default addresses of the same type for this customer
    UPDATE customer_addresses
    SET is_default = false
    WHERE customer_id = NEW.customer_id
      AND type = NEW.type
      AND id != NEW.id
      AND is_default = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure single default address
DROP TRIGGER IF EXISTS ensure_single_default_address_trigger ON customer_addresses;
CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

-- Note: Address data migration skipped as profiles table doesn't have billing_address column
-- Customers will add their addresses through the UI

-- Comments
COMMENT ON TABLE customer_addresses IS 'Customer addresses for billing, shipping, etc.';
COMMENT ON COLUMN customer_addresses.type IS 'Address type: billing, shipping, other';
COMMENT ON COLUMN customer_addresses.is_default IS 'Default address for this type';
COMMENT ON COLUMN customer_addresses.tax_office IS 'Vergi dairesi (Turkish tax office)';
COMMENT ON COLUMN customer_addresses.tax_number IS 'Vergi numarası (Turkish tax number)';
COMMENT ON COLUMN customer_addresses.identity_number IS 'TC kimlik numarası (Turkish identity number)';
