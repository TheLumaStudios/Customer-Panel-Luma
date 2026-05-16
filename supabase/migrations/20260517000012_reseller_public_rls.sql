-- Reseller domain tespiti için anon erişim
-- Bayi domain'ine gelen ziyaretçi henüz giriş yapmamış (anon) olabilir.
-- Sadece marka bilgilerini okuma izni veriyoruz.

CREATE POLICY "public_reseller_branding" ON resellers
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active' AND domain IS NOT NULL);
