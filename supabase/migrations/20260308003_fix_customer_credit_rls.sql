-- Fix customer_credit RLS policies to handle missing records

-- Drop existing policies
DROP POLICY IF EXISTS "Customers can view their own credit" ON customer_credit;
DROP POLICY IF EXISTS "Admins can do everything on customer credit" ON customer_credit;

-- Customers can view their own credit (allow even if no record exists)
CREATE POLICY "Customers can view their own credit"
  ON customer_credit FOR SELECT
  TO authenticated
  USING (
    auth.uid() = customer_id
    OR NOT EXISTS (SELECT 1 FROM customer_credit WHERE customer_id = auth.uid())
  );

-- Customers can insert their own credit record if it doesn't exist
CREATE POLICY "Customers can create their own credit record"
  ON customer_credit FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

-- Admins can do everything
CREATE POLICY "Admins can do everything on customer credit"
  ON customer_credit FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create default credit record for existing users who don't have one
INSERT INTO customer_credit (customer_id, balance, currency)
SELECT id, 0, 'USD'
FROM profiles
WHERE role = 'customer'
AND NOT EXISTS (
  SELECT 1 FROM customer_credit WHERE customer_id = profiles.id
)
ON CONFLICT (customer_id) DO NOTHING;
