-- Fix customer_addresses foreign key to reference customers instead of profiles
-- This fixes the "violates foreign key constraint" error when customers add addresses

-- Drop the old foreign key constraint
ALTER TABLE customer_addresses
DROP CONSTRAINT IF EXISTS customer_addresses_customer_id_fkey;

-- Add new foreign key constraint referencing customers table
ALTER TABLE customer_addresses
ADD CONSTRAINT customer_addresses_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- Update RLS policies to work with customers table
-- (Previous policies used auth.uid() which works for profiles,
--  now we need to check customers.email = auth.jwt()->>'email')

-- Drop existing policies
DROP POLICY IF EXISTS "Customers can view their own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can create their own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can update their own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can delete their own addresses" ON customer_addresses;

-- Customers can view their own addresses (by matching email from JWT)
CREATE POLICY "Customers can view their own addresses" ON customer_addresses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_addresses.customer_id
      AND customers.email = auth.jwt()->>'email'
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'employee')
    )
  );

-- Customers can create their own addresses (by matching email from JWT)
CREATE POLICY "Customers can create their own addresses" ON customer_addresses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_addresses.customer_id
      AND customers.email = auth.jwt()->>'email'
    )
  );

-- Customers can update their own addresses (by matching email from JWT)
CREATE POLICY "Customers can update their own addresses" ON customer_addresses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_addresses.customer_id
      AND customers.email = auth.jwt()->>'email'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_addresses.customer_id
      AND customers.email = auth.jwt()->>'email'
    )
  );

-- Customers can delete their own addresses (by matching email from JWT)
CREATE POLICY "Customers can delete their own addresses" ON customer_addresses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_addresses.customer_id
      AND customers.email = auth.jwt()->>'email'
    )
  );

COMMENT ON CONSTRAINT customer_addresses_customer_id_fkey ON customer_addresses
IS 'References customers table (not profiles) since customer panel users are in customers table';
