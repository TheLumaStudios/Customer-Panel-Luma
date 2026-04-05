-- Müşteri tipi: yazılım veya host
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type text DEFAULT 'host' CHECK (customer_type IN ('software', 'host'));

-- Yazılım müşterisi ilk yıl ücretsiz hosting ayarı
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
  ('software_customer_free_hosting_months', '12', 'number', 'pricing', 'Yazılım müşterilerine ücretsiz verilen hosting süresi (ay)'),
  ('software_customer_free_hosting_enabled', 'true', 'boolean', 'pricing', 'Yazılım müşterilerine ücretsiz hosting aktif mi')
ON CONFLICT (setting_key) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
