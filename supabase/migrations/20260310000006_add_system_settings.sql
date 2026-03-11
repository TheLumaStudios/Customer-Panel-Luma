-- Sistem ayarları tablosu
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'text', -- text, number, boolean, json
  category VARCHAR(50), -- payment, invoice, email, general
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- İyzico ödeme ayarları
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('iyzico_invoice_type', 'Mükerrer 20/B', 'text', 'payment', 'İyzico ödemeleri için fatura tipi'),
('iyzico_payment_method', 'İyzico Kredi Kartı', 'text', 'payment', 'İyzico ödemeleri için ödeme yöntemi'),
('iyzico_official_invoice', 'true', 'boolean', 'payment', 'İyzico ödemeleri için resmi fatura'),
('is_bankasi_iban', '', 'text', 'payment', 'İş Bankası IBAN numarası'),
('ziraat_bankasi_iban', '', 'text', 'payment', 'Ziraat Bankası IBAN numarası'),
('default_bank_iban', '', 'text', 'payment', 'Varsayılan banka IBAN numarası');

-- İndeks
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON system_settings(category);

-- RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Sadece adminler okuyabilir ve yazabilir
CREATE POLICY "Admins can manage system settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

COMMENT ON TABLE system_settings IS 'Sistem geneli ayarlar ve yapılandırmalar';
