-- Fix RLS policy for customers to create their approvals
-- Customers need to insert into contract_approvals

-- Drop old policy if exists
DROP POLICY IF EXISTS "Customers can create their approvals" ON contract_approvals;

-- Create new policy that allows customers to insert approvals
-- by matching email from auth JWT to customers table
CREATE POLICY "Customers can create their approvals"
  ON contract_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = contract_approvals.customer_id
      AND customers.email = auth.jwt()->>'email'
    )
  );

COMMENT ON POLICY "Customers can create their approvals" ON contract_approvals
IS 'Allows customers to create approvals for their own contracts by matching email';
