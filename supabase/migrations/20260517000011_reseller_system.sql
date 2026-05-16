-- ─── Reseller (Bayi) Sistemi ─────────────────────────────────────────────────
-- Bayiler kendi domainlerini getirirler, Luma altyapısıyla satış yapar,
-- bayi kar payı alır.

-- Bayiler tablosu
CREATE TABLE IF NOT EXISTS resellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  domain text UNIQUE,                        -- Bayinin özel alan adı (örn: panel.bayidomain.com)
  status text NOT NULL DEFAULT 'active'      -- active | suspended | pending
    CHECK (status IN ('active', 'suspended', 'pending')),
  margin_type text NOT NULL DEFAULT 'percent'
    CHECK (margin_type IN ('percent', 'fixed')),
  margin_value numeric(10,4) NOT NULL DEFAULT 20, -- % 20 varsayılan kar payı
  -- Marka ayarları
  brand_name text,
  brand_logo_url text,
  brand_primary_color text DEFAULT '#4F46E5',
  brand_secondary_color text DEFAULT '#7C3AED',
  brand_favicon_url text,
  brand_footer_text text,
  -- İletişim
  contact_email text,
  contact_phone text,
  -- Ödeme
  wallet_balance numeric(12,2) NOT NULL DEFAULT 0,  -- Birikmiş kar payı
  total_earned numeric(12,2) NOT NULL DEFAULT 0,
  -- Meta
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bayiye özgü ürün fiyatlandırması (opsiyonel override)
-- Belirtilmezse resellers.margin_value global olarak uygulanır
CREATE TABLE IF NOT EXISTS reseller_tier_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  product_type text NOT NULL,  -- 'hosting' | 'domain' | 'vds' | 'ssl'
  product_key text,            -- NULL = tüm ürünler bu tipe girer, dolu = belirli paket
  margin_type text NOT NULL DEFAULT 'percent'
    CHECK (margin_type IN ('percent', 'fixed')),
  margin_value numeric(10,4) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (reseller_id, product_type, product_key)
);

-- Bayi müşterileri — hangi müşteri hangi bayi üzerinden kayıt oldu
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS reseller_id uuid REFERENCES resellers(id) ON DELETE SET NULL;

-- Bayi kazanç log'u
CREATE TABLE IF NOT EXISTS reseller_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  gross_amount numeric(12,2) NOT NULL,  -- Müşterinin ödediği
  margin_pct numeric(6,4) NOT NULL,     -- Uygulanan oran
  earned_amount numeric(12,2) NOT NULL, -- Bayinin kazandığı
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Bayi domain doğrulama kaydı (TXT record tabanlı)
CREATE TABLE IF NOT EXISTS reseller_domain_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  domain text NOT NULL,
  verification_token text NOT NULL DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- İndexler
CREATE INDEX IF NOT EXISTS idx_resellers_domain ON resellers(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resellers_status ON resellers(status);
CREATE INDEX IF NOT EXISTS idx_customers_reseller ON customers(reseller_id) WHERE reseller_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reseller_earnings_reseller ON reseller_earnings(reseller_id, status);

-- RLS
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_tier_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_domain_verifications ENABLE ROW LEVEL SECURITY;

-- Admin/employee: tam erişim
CREATE POLICY "admin_all_resellers" ON resellers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')));

CREATE POLICY "admin_all_reseller_pricing" ON reseller_tier_pricing
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')));

CREATE POLICY "admin_all_reseller_earnings" ON reseller_earnings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')));

CREATE POLICY "admin_all_reseller_verifications" ON reseller_domain_verifications
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')));

-- Bayinin kendi verilerini görmesi
CREATE POLICY "reseller_own_data" ON resellers
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "reseller_own_pricing" ON reseller_tier_pricing
  FOR SELECT TO authenticated
  USING (reseller_id IN (SELECT id FROM resellers WHERE profile_id = auth.uid()));

CREATE POLICY "reseller_own_earnings" ON reseller_earnings
  FOR SELECT TO authenticated
  USING (reseller_id IN (SELECT id FROM resellers WHERE profile_id = auth.uid()));

-- Comments
COMMENT ON TABLE resellers IS 'Bayi (reseller) hesapları — kendi domainleriyle Luma altyapısını kullanır';
COMMENT ON TABLE reseller_tier_pricing IS 'Bayi bazlı ürün kar marjı overrideları';
COMMENT ON TABLE reseller_earnings IS 'Bayi başına fatura bazlı kazanç log''u';
COMMENT ON COLUMN resellers.margin_value IS 'Percent: 0-100 arası yüzde; Fixed: TRY cinsinden sabit tutar';
