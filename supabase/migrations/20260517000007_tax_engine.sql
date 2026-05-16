-- Multi-Tax / AB-VAT Engine
-- Türkiye KDV, AB VAT (reverse charge), ve özel ülke kuralları

-- Vergi kuralları tablosu
CREATE TABLE IF NOT EXISTS tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,   -- 'TR', 'DE', 'FR', '*' (varsayılan)
  tax_type text NOT NULL CHECK (tax_type IN ('KDV', 'VAT', 'NONE')),
  rate numeric NOT NULL DEFAULT 0 CHECK (rate BETWEEN 0 AND 100),
  applies_to text[] NOT NULL DEFAULT '{all}',  -- ['hosting','vds','domain'] veya ['all']
  description text,
  priority integer NOT NULL DEFAULT 0,  -- Yüksek öncelik önce uygulanır
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Varsayılan kurallar
INSERT INTO tax_rules (country_code, tax_type, rate, applies_to, description, priority) VALUES
  ('TR', 'KDV',  20,  '{all}',    'Türkiye — Tüm hizmetlerde %20 KDV',             10),
  ('*',  'VAT',  20,  '{all}',    'AB ülkeleri — varsayılan %20 VAT',               5),
  ('*',  'NONE', 0,   '{wallet_topup}', 'Cüzdan yüklemesi — vergisiz',              20)
ON CONFLICT DO NOTHING;

-- CREATE INDEX
CREATE INDEX IF NOT EXISTS idx_tax_rules_country ON tax_rules(country_code, is_active);

-- customers tablosuna vergi ve ülke alanları
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'TR',
  ADD COLUMN IF NOT EXISTS vat_id text,
  ADD COLUMN IF NOT EXISTS vat_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vat_verified_at timestamptz;

COMMENT ON COLUMN customers.country_code IS 'ISO 3166-1 alpha-2 ülke kodu (TR, DE, FR...)';
COMMENT ON COLUMN customers.vat_id IS 'AB VAT numarası (ör. DE123456789) — geçerliyse reverse charge uygulanır';
COMMENT ON COLUMN customers.vat_verified IS 'VAT ID, VIES API ile doğrulandı mı?';

-- AB ülke listesi (reverse charge için)
CREATE TABLE IF NOT EXISTS eu_countries (
  country_code text PRIMARY KEY,
  country_name text NOT NULL
);

INSERT INTO eu_countries (country_code, country_name) VALUES
  ('AT','Avusturya'),('BE','Belçika'),('BG','Bulgaristan'),('HR','Hırvatistan'),
  ('CY','Kıbrıs'),('CZ','Çekya'),('DK','Danimarka'),('EE','Estonya'),
  ('FI','Finlandiya'),('FR','Fransa'),('DE','Almanya'),('GR','Yunanistan'),
  ('HU','Macaristan'),('IE','İrlanda'),('IT','İtalya'),('LV','Letonya'),
  ('LT','Litvanya'),('LU','Lüksemburg'),('MT','Malta'),('NL','Hollanda'),
  ('PL','Polonya'),('PT','Portekiz'),('RO','Romanya'),('SK','Slovakya'),
  ('SI','Slovenya'),('ES','İspanya'),('SE','İsveç')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE eu_countries IS 'AB üye ülkeleri — reverse charge kontrolü için kullanılır';
