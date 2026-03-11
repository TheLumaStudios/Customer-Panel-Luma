-- Fix RLS policy for customers to view their contracts
-- Problem: customer_id != auth.uid(), we need to match by email

-- Drop old policy
DROP POLICY IF EXISTS "Customers can view their contracts" ON customer_contracts;

-- Create new policy that matches by email
CREATE POLICY "Customers can view their contracts"
  ON customer_contracts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_contracts.customer_id
      AND customers.email = auth.jwt()->>'email'
    )
  );

COMMENT ON POLICY "Customers can view their contracts" ON customer_contracts
IS 'Allows customers to view their own contracts by matching email from auth JWT to customers table';
