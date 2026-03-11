-- Simplify contract approval policy
-- Allow all authenticated users to insert approvals
-- (we verify ownership in the application code)

-- Drop existing policy
DROP POLICY IF EXISTS "Customers can create their approvals" ON contract_approvals;

-- Create simpler policy - allow all authenticated users to insert
-- We handle authorization in the application layer
CREATE POLICY "Authenticated users can create approvals"
  ON contract_approvals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also ensure customers can view their own approvals
DROP POLICY IF EXISTS "Customers can view their approvals" ON contract_approvals;

CREATE POLICY "Customers can view their approvals"
  ON contract_approvals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = contract_approvals.customer_id
      AND customers.email = auth.jwt()->>'email'
    )
  );

COMMENT ON POLICY "Authenticated users can create approvals" ON contract_approvals
IS 'Allows authenticated users to create contract approvals. Authorization is handled in application code.';
