-- Çalışanlar için müşteri erişim politikaları

-- Çalışanlar tüm müşterileri görebilir
DROP POLICY IF EXISTS "Employees can view all customers" ON customers;
CREATE POLICY "Employees can view all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Çalışanlar müşteri oluşturabilir
DROP POLICY IF EXISTS "Employees can create customers" ON customers;
CREATE POLICY "Employees can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Çalışanlar müşteri güncelleyebilir
DROP POLICY IF EXISTS "Employees can update customers" ON customers;
CREATE POLICY "Employees can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Çalışanlar tüm profilleri görebilir (müşteri seçimi için)
DROP POLICY IF EXISTS "Employees can view all profiles" ON profiles;
CREATE POLICY "Employees can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'employee'
    )
  );

COMMENT ON POLICY "Employees can view all customers" ON customers IS 'Çalışanlar tüm müşterileri görüntüleyebilir';
COMMENT ON POLICY "Employees can view all profiles" ON profiles IS 'Çalışanlar tüm profilleri görüntüleyebilir';
