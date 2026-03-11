-- Çalışanlar için fatura ve ödeme politikaları

-- Çalışanlar tüm faturaları görebilir
DROP POLICY IF EXISTS "Employees can view all invoices" ON invoices;
CREATE POLICY "Employees can view all invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Çalışanlar fatura oluşturabilir
DROP POLICY IF EXISTS "Employees can create invoices" ON invoices;
CREATE POLICY "Employees can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Çalışanlar fatura güncelleyebilir
DROP POLICY IF EXISTS "Employees can update invoices" ON invoices;
CREATE POLICY "Employees can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Çalışanlar fatura silebilir
DROP POLICY IF EXISTS "Employees can delete invoices" ON invoices;
CREATE POLICY "Employees can delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Çalışanlar tüm fatura kalemlerini görebilir
DROP POLICY IF EXISTS "Employees can view all invoice items" ON invoice_items;
CREATE POLICY "Employees can view all invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Çalışanlar fatura kalemi ekleyebilir
DROP POLICY IF EXISTS "Employees can create invoice items" ON invoice_items;
CREATE POLICY "Employees can create invoice items"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Çalışanlar fatura kalemi güncelleyebilir
DROP POLICY IF EXISTS "Employees can update invoice items" ON invoice_items;
CREATE POLICY "Employees can update invoice items"
  ON invoice_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Çalışanlar fatura kalemi silebilir
DROP POLICY IF EXISTS "Employees can delete invoice items" ON invoice_items;
CREATE POLICY "Employees can delete invoice items"
  ON invoice_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Çalışanlar tüm ödemeleri görebilir
DROP POLICY IF EXISTS "Employees can view all payments" ON payments;
CREATE POLICY "Employees can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Çalışanlar ödeme oluşturabilir
DROP POLICY IF EXISTS "Employees can create payments" ON payments;
CREATE POLICY "Employees can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Çalışanlar ödeme güncelleyebilir
DROP POLICY IF EXISTS "Employees can update payments" ON payments;
CREATE POLICY "Employees can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Çalışanlar ödeme silebilir
DROP POLICY IF EXISTS "Employees can delete payments" ON payments;
CREATE POLICY "Employees can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

COMMENT ON POLICY "Employees can view all invoices" ON invoices IS 'Çalışanlar tüm faturaları görüntüleyebilir';
COMMENT ON POLICY "Employees can create invoices" ON invoices IS 'Çalışanlar fatura oluşturabilir';
