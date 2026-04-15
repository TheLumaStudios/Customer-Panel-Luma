-- Kaldıraçlı Bakiye Bonusları + Cashback + İade Talebi

-- wallet_bonus_tiers: defines bonus brackets for wallet top-ups
CREATE TABLE IF NOT EXISTS wallet_bonus_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_amount NUMERIC(10,2) NOT NULL,
  max_amount NUMERIC(10,2),
  bonus_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  bonus_fixed NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed bonus tiers: 100→110 (+10%), 500→650 (+30%), 1000→1500 (+50%)
INSERT INTO wallet_bonus_tiers (min_amount, max_amount, bonus_percentage, label) VALUES
  (100, 499.99, 10, '100₺ yükle, 110₺ kullan'),
  (500, 999.99, 30, '500₺ yükle, 650₺ kullan'),
  (1000, NULL, 50, '1000₺ yükle, 1500₺ kullan');

-- cashback_rate in system_settings
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('cashback_rate', '5', 'Ödeme sonrası cüzdana iade yüzdesi')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = '5';

-- wallet_refund_requests: customers can request refund of unused balance
CREATE TABLE IF NOT EXISTS wallet_refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  reason TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_refund_requests_profile ON wallet_refund_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_wallet_refund_requests_status ON wallet_refund_requests(status);

-- RLS
ALTER TABLE wallet_bonus_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_refund_requests ENABLE ROW LEVEL SECURITY;

-- Everyone can read bonus tiers
CREATE POLICY "public_read_bonus_tiers" ON wallet_bonus_tiers FOR SELECT USING (true);

-- Admin manages bonus tiers
CREATE POLICY "admin_manage_bonus_tiers" ON wallet_bonus_tiers FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users can create and read own refund requests
CREATE POLICY "user_manage_own_refunds" ON wallet_refund_requests FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "user_create_refund" ON wallet_refund_requests FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Admin full access on refund requests
CREATE POLICY "admin_manage_refunds" ON wallet_refund_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
