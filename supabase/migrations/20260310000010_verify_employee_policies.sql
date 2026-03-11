-- Çalışan politikalarını doğrula ve düzelt

-- invoices için tüm mevcut politikaları kaldır ve yeniden oluştur
DO $$
BEGIN
    -- invoices tablosu için çalışan politikalarını temizle
    DROP POLICY IF EXISTS "Employees can view all invoices" ON invoices;
    DROP POLICY IF EXISTS "Employees can create invoices" ON invoices;
    DROP POLICY IF EXISTS "Employees can update invoices" ON invoices;
    DROP POLICY IF EXISTS "Employees can delete invoices" ON invoices;
END $$;

-- Çalışanlar tüm faturaları görebilir (SELECT)
CREATE POLICY "Employees can view all invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

-- Çalışanlar fatura oluşturabilir (INSERT)
CREATE POLICY "Employees can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

-- Çalışanlar fatura güncelleyebilir (UPDATE)
CREATE POLICY "Employees can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

-- Çalışanlar fatura silebilir (DELETE)
CREATE POLICY "Employees can delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

-- invoice_items için politikalar
DO $$
BEGIN
    DROP POLICY IF EXISTS "Employees can view all invoice items" ON invoice_items;
    DROP POLICY IF EXISTS "Employees can create invoice items" ON invoice_items;
    DROP POLICY IF EXISTS "Employees can update invoice items" ON invoice_items;
    DROP POLICY IF EXISTS "Employees can delete invoice items" ON invoice_items;
END $$;

CREATE POLICY "Employees can view all invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

CREATE POLICY "Employees can create invoice items"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

CREATE POLICY "Employees can update invoice items"
  ON invoice_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

CREATE POLICY "Employees can delete invoice items"
  ON invoice_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

-- customers için politikalar
DO $$
BEGIN
    DROP POLICY IF EXISTS "Employees can view all customers" ON customers;
    DROP POLICY IF EXISTS "Employees can create customers" ON customers;
    DROP POLICY IF EXISTS "Employees can update customers" ON customers;
END $$;

CREATE POLICY "Employees can view all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

CREATE POLICY "Employees can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

CREATE POLICY "Employees can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

-- payments için politikalar
DO $$
BEGIN
    DROP POLICY IF EXISTS "Employees can view all payments" ON payments;
    DROP POLICY IF EXISTS "Employees can create payments" ON payments;
    DROP POLICY IF EXISTS "Employees can update payments" ON payments;
    DROP POLICY IF EXISTS "Employees can delete payments" ON payments;
END $$;

CREATE POLICY "Employees can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

CREATE POLICY "Employees can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

CREATE POLICY "Employees can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

CREATE POLICY "Employees can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('employee', 'admin')
    )
  );

-- profiles için politika (hem employee hem admin içermeli)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Employees can view all profiles" ON profiles;
END $$;

CREATE POLICY "Employees can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('employee', 'admin')
    )
  );

COMMENT ON POLICY "Employees can view all invoices" ON invoices IS 'Çalışanlar ve adminler tüm faturaları görüntüleyebilir';
COMMENT ON POLICY "Employees can view all customers" ON customers IS 'Çalışanlar ve adminler tüm müşterileri görüntüleyebilir';
