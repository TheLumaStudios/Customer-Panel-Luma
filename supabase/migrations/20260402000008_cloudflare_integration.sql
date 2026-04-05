-- Cloudflare zone bilgilerini domain tablosuna ekle
ALTER TABLE domains ADD COLUMN IF NOT EXISTS cf_zone_id text;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS cf_nameservers text[];
ALTER TABLE domains ADD COLUMN IF NOT EXISTS cf_status text; -- pending, active, moved
ALTER TABLE domains ADD COLUMN IF NOT EXISTS cf_plan text DEFAULT 'free';

-- Cloudflare API ayarları
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
  ('cf_api_token', '', 'text', 'cloudflare', 'Cloudflare API Token (Zone:Edit, DNS:Edit)'),
  ('cf_account_id', '', 'text', 'cloudflare', 'Cloudflare Account ID'),
  ('cf_vanity_ns_enabled', 'false', 'boolean', 'cloudflare', 'Vanity nameserver aktif mi (Business plan gerekli)'),
  ('cf_vanity_ns1', 'ns1.lumayazilim.com', 'text', 'cloudflare', 'Vanity NS1 (Business plan)'),
  ('cf_vanity_ns2', 'ns2.lumayazilim.com', 'text', 'cloudflare', 'Vanity NS2 (Business plan)')
ON CONFLICT (setting_key) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_domains_cf_zone ON domains(cf_zone_id);
