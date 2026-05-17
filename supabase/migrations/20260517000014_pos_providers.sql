-- POS Providers — çoklu sanal pos desteği
-- Kimlik bilgileri system_settings'e kaydedilir, bu tablo provider registry

CREATE TABLE IF NOT EXISTS pos_providers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     TEXT NOT NULL UNIQUE,      -- 'qnb', 'iyzico', 'akbank' vs.
  display_name TEXT NOT NULL,
  is_active    BOOLEAN DEFAULT false,
  is_default   BOOLEAN DEFAULT false,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Sadece bir tanesi default olabilsin
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_providers_default
  ON pos_providers (is_default) WHERE is_default = true;

ALTER TABLE pos_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_pos_providers"
  ON pos_providers FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','employee'))
  );

-- Seed: mevcut providerlar
INSERT INTO pos_providers (provider, display_name, is_active, is_default, sort_order)
VALUES
  ('iyzico', 'iyzico', true, true, 1),
  ('qnb',    'QNB Sanal POS', false, false, 2)
ON CONFLICT (provider) DO NOTHING;

-- QNB credentials system_settings'e ekle (boş başlıyoruz, admin dolduracak)
INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
VALUES
  ('qnb_mbr_id',        '5',   'string',  'QNB Kurum Kodu (MbrId)'),
  ('qnb_merchant_id',   '',    'string',  'QNB Üye İşyeri Numarası (MerchantId)'),
  ('qnb_user_code',     '',    'string',  'QNB Kullanıcı Kodu (UserCode)'),
  ('qnb_user_pass',     '',    'string',  'QNB Kullanıcı Şifresi (UserPass)'),
  ('qnb_merchant_pass', '',    'string',  'QNB 3D Secure Şifresi (MerchantPass)'),
  ('qnb_test_mode',     'true','boolean', 'QNB Test Modu (vpostest.qnb.com.tr)'),
  ('qnb_currency',      '949', 'string',  'QNB Para Birimi (949=TRY)'),
  ('qnb_installments',  '1,2,3,6,9,12', 'string', 'İzin verilen taksit sayıları (virgülle)')
ON CONFLICT (setting_key) DO NOTHING;
