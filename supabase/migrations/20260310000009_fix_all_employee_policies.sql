-- Çalışanlar için TÜM gerekli tablo politikaları

-- customer_addresses
DROP POLICY IF EXISTS "Employees can view all customer addresses" ON customer_addresses;
CREATE POLICY "Employees can view all customer addresses"
  ON customer_addresses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

DROP POLICY IF EXISTS "Employees can manage customer addresses" ON customer_addresses;
CREATE POLICY "Employees can manage customer addresses"
  ON customer_addresses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- domains
DROP POLICY IF EXISTS "Employees can view all domains" ON domains;
CREATE POLICY "Employees can view all domains"
  ON domains FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

DROP POLICY IF EXISTS "Employees can manage domains" ON domains;
CREATE POLICY "Employees can manage domains"
  ON domains FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- hosting
DROP POLICY IF EXISTS "Employees can view all hosting" ON hosting;
CREATE POLICY "Employees can view all hosting"
  ON hosting FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

DROP POLICY IF EXISTS "Employees can manage hosting" ON hosting;
CREATE POLICY "Employees can manage hosting"
  ON hosting FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- hosting_packages
DROP POLICY IF EXISTS "Employees can view hosting packages" ON hosting_packages;
CREATE POLICY "Employees can view hosting packages"
  ON hosting_packages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- vds
DROP POLICY IF EXISTS "Employees can view all vds" ON vds;
CREATE POLICY "Employees can view all vds"
  ON vds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

DROP POLICY IF EXISTS "Employees can manage vds" ON vds;
CREATE POLICY "Employees can manage vds"
  ON vds FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- support_tickets
DROP POLICY IF EXISTS "Employees can view all tickets" ON support_tickets;
CREATE POLICY "Employees can view all tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

DROP POLICY IF EXISTS "Employees can manage tickets" ON support_tickets;
CREATE POLICY "Employees can manage tickets"
  ON support_tickets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- customer_credit (bakiye sistemine erişim)
DROP POLICY IF EXISTS "Employees can view customer credit" ON customer_credit;
CREATE POLICY "Employees can view customer credit"
  ON customer_credit FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

DROP POLICY IF EXISTS "Employees can manage customer credit" ON customer_credit;
CREATE POLICY "Employees can manage customer credit"
  ON customer_credit FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- credit_transactions
DROP POLICY IF EXISTS "Employees can view credit transactions" ON credit_transactions;
CREATE POLICY "Employees can view credit transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

DROP POLICY IF EXISTS "Employees can manage credit transactions" ON credit_transactions;
CREATE POLICY "Employees can manage credit transactions"
  ON credit_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- system_settings (okuma yetkisi)
DROP POLICY IF EXISTS "Employees can view system settings" ON system_settings;
CREATE POLICY "Employees can view system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

COMMENT ON POLICY "Employees can view all customer addresses" ON customer_addresses IS 'Çalışanlar tüm müşteri adreslerini görüntüleyebilir';
COMMENT ON POLICY "Employees can view all domains" ON domains IS 'Çalışanlar tüm domainleri görüntüleyebilir';
COMMENT ON POLICY "Employees can view all hosting" ON hosting IS 'Çalışanlar tüm hosting hesaplarını görüntüleyebilir';
