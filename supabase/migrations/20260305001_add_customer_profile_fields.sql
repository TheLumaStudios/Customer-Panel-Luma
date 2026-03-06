-- Add profile fields to customers table
-- This allows storing customer information directly in customers table
-- instead of relying on profiles table (which requires auth.users)

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tc_no VARCHAR(11),
  ADD COLUMN IF NOT EXISTS vkn VARCHAR(10),
  ADD COLUMN IF NOT EXISTS tax_office VARCHAR(100),
  ADD COLUMN IF NOT EXISTS fax VARCHAR(50),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

COMMENT ON COLUMN customers.full_name IS 'Customer full name';
COMMENT ON COLUMN customers.email IS 'Customer email address';
COMMENT ON COLUMN customers.phone IS 'Customer phone number';
COMMENT ON COLUMN customers.company_name IS 'Company name if customer is a business';
COMMENT ON COLUMN customers.tc_no IS 'Turkish citizen ID number (TC Kimlik No)';
COMMENT ON COLUMN customers.vkn IS 'Tax identification number (Vergi Kimlik Numarası)';
COMMENT ON COLUMN customers.tax_office IS 'Tax office name';
COMMENT ON COLUMN customers.fax IS 'Fax number';
COMMENT ON COLUMN customers.website IS 'Customer website URL';
COMMENT ON COLUMN customers.notes IS 'Additional notes about the customer';
