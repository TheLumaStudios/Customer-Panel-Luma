-- Fix customer-side invoice visibility.
--
-- Problem: the original policy assumed `invoices.customer_id = auth.uid()`
-- (i.e. profiles.id). The live schema has since been altered so
-- `invoices.customer_id` actually references `customers.id`, which is a
-- separate UUID from the auth user. As a result every customer-side query
-- hit zero rows and faturalar müşteri panelinde görünmüyordu.
--
-- Fix: resolve ownership through the `customers` table, matching either by
-- `profile_id` (preferred) or by email (fallback for legacy rows where
-- profile_id was never backfilled).

DROP POLICY IF EXISTS "Customers can view their own invoices" ON invoices;
CREATE POLICY "Customers can view their own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = invoices.customer_id
        AND (
          c.profile_id = auth.uid()
          OR c.email = (SELECT email FROM profiles WHERE id = auth.uid())
        )
    )
  );

-- Same fix for invoice_items so the customer can see line-item detail.
DROP POLICY IF EXISTS "Customers can view their own invoice items" ON invoice_items;
CREATE POLICY "Customers can view their own invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      WHERE i.id = invoice_items.invoice_id
        AND (
          c.profile_id = auth.uid()
          OR c.email = (SELECT email FROM profiles WHERE id = auth.uid())
        )
    )
  );

-- And payments (so "Son ödemeler" listesi çalışsın).
DROP POLICY IF EXISTS "Customers can view their own payments" ON payments;
CREATE POLICY "Customers can view their own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() -- payments.customer_id hâlâ profiles.id
    OR EXISTS (
      SELECT 1 FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      WHERE i.id = payments.invoice_id
        AND (
          c.profile_id = auth.uid()
          OR c.email = (SELECT email FROM profiles WHERE id = auth.uid())
        )
    )
  );
