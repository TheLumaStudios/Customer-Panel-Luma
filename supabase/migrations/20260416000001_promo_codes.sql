-- Promo/Kupon Kodu Sistemi
-- promo_codes tablosu
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  max_uses_per_customer INTEGER DEFAULT NULL,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ DEFAULT NULL,
  applicable_types TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_first_month_free BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- promo_code_usage tablosu
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  discount_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- invoices tablosuna promo sütunları
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

-- Index
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_customer ON promo_code_usage(customer_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_promo ON promo_code_usage(promo_code_id);

-- RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Admin full CRUD
CREATE POLICY "admin_full_promo_codes" ON promo_codes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Customer SELECT active only
CREATE POLICY "customer_read_active_promos" ON promo_codes FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Admin full on usage
CREATE POLICY "admin_full_promo_usage" ON promo_code_usage FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Customer can see own usage
CREATE POLICY "customer_read_own_usage" ON promo_code_usage FOR SELECT
  USING (customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid()));
