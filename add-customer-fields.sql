-- Profiles tablosuna ek müşteri bilgileri ekleme

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS tc_no VARCHAR(11),
ADD COLUMN IF NOT EXISTS vkn VARCHAR(10),
ADD COLUMN IF NOT EXISTS tax_office VARCHAR(100),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS fax VARCHAR(20),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Customers tablosuna adres bilgileri ekleme
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_district VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_postal_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100) DEFAULT 'Türkiye',
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS shipping_district VARCHAR(100),
ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100) DEFAULT 'Türkiye',
ADD COLUMN IF NOT EXISTS same_as_billing BOOLEAN DEFAULT true;

-- Indexler
CREATE INDEX IF NOT EXISTS idx_profiles_vkn ON profiles(vkn);
CREATE INDEX IF NOT EXISTS idx_profiles_tc_no ON profiles(tc_no);
CREATE INDEX IF NOT EXISTS idx_customers_billing_city ON customers(billing_city);

COMMENT ON COLUMN profiles.tc_no IS 'TC Kimlik Numarası (11 haneli)';
COMMENT ON COLUMN profiles.vkn IS 'Vergi Kimlik Numarası (10 haneli)';
COMMENT ON COLUMN profiles.tax_office IS 'Vergi Dairesi';
COMMENT ON COLUMN customers.same_as_billing IS 'Sevkiyat adresi fatura adresi ile aynı mı?';
