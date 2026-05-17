-- Tami (Garanti BBVA) Sanal POS ayarları
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('tami_merchant_number', '', 'Tami üye işyeri numarası'),
  ('tami_terminal_number', '', 'Tami terminal numarası'),
  ('tami_api_key',         '', 'Tami JWK "k" değeri (base64url)'),
  ('tami_key_id',          '', 'Tami JWK "kid" değeri'),
  ('tami_test_mode',       'true', 'Tami test modu (sandbox)')
ON CONFLICT (setting_key) DO NOTHING;

-- pos_providers tablosuna Tami ekle
INSERT INTO pos_providers (provider, display_name, is_active, is_default, sort_order)
VALUES ('tami', 'Tami (Garanti BBVA)', false, false, 3)
ON CONFLICT (provider) DO NOTHING;
