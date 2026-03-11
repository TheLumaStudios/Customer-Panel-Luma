-- iyzico'nun TÜM özelliklerini desteklemek için kapsamlı database yapısı

-- Kayıtlı kartlar tablosu
CREATE TABLE IF NOT EXISTS saved_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- iyzico kart bilgileri
  card_token VARCHAR(255) UNIQUE NOT NULL,
  card_user_key VARCHAR(255),
  card_alias VARCHAR(100),

  -- Kart detayları (son 4 hane vs.)
  bin_number VARCHAR(6),
  last_four_digits VARCHAR(4),
  card_type VARCHAR(50), -- CREDIT_CARD, DEBIT_CARD
  card_association VARCHAR(50), -- VISA, MASTER_CARD, AMERICAN_EXPRESS
  card_family VARCHAR(100), -- Maximum, Axess, etc.
  bank_name VARCHAR(100),

  -- Durum
  is_default BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active', -- active, deleted

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İade işlemleri tablosu
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

  -- iyzico iade bilgileri
  iyzico_payment_id VARCHAR(255),
  iyzico_payment_transaction_id VARCHAR(255),

  -- İade detayları
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',
  reason TEXT,

  -- Durum
  status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed

  -- iyzico yanıt
  iyzico_response JSONB,
  error_message TEXT,

  -- Kim tarafından yapıldı
  created_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İptal işlemleri tablosu
CREATE TABLE IF NOT EXISTS cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

  -- iyzico iptal bilgileri
  iyzico_payment_id VARCHAR(255),

  -- İptal detayları
  reason TEXT,

  -- Durum
  status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed

  -- iyzico yanıt
  iyzico_response JSONB,
  error_message TEXT,

  -- Kim tarafından yapıldı
  created_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pazaryeri (Marketplace) alt üye işyerleri
CREATE TABLE IF NOT EXISTS marketplace_submerchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Alt üye işyeri bilgileri
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,

  -- iyzico submerchant bilgileri
  iyzico_submerchant_key VARCHAR(255) UNIQUE,
  iyzico_submerchant_type VARCHAR(50), -- PERSONAL, PRIVATE_COMPANY, LIMITED_OR_JOINT_STOCK_COMPANY

  -- Komisyon oranı (%)
  commission_rate DECIMAL(5, 2) DEFAULT 0,

  -- Banka bilgileri
  iban VARCHAR(34),

  -- İletişim
  contact_name VARCHAR(255),
  contact_surname VARCHAR(255),
  phone VARCHAR(20),

  -- Adres
  address TEXT,

  -- Kimlik
  identity_number VARCHAR(11),
  tax_office VARCHAR(100),
  tax_number VARCHAR(20),

  -- Durum
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, rejected, suspended

  -- Onay bilgileri
  iyzico_response JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pazaryeri ödemeleri (commission split)
CREATE TABLE IF NOT EXISTS marketplace_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  submerchant_id UUID NOT NULL REFERENCES marketplace_submerchants(id) ON DELETE CASCADE,

  -- Ödeme dağılımı
  submerchant_amount DECIMAL(10, 2) NOT NULL, -- Alt üye işyerine giden
  platform_commission DECIMAL(10, 2) NOT NULL, -- Platform komisyonu

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BIN sorgulama cache (performans için)
CREATE TABLE IF NOT EXISTS bin_lookups (
  bin_number VARCHAR(6) PRIMARY KEY,

  -- Kart bilgileri
  card_type VARCHAR(50),
  card_association VARCHAR(50),
  card_family VARCHAR(100),
  bank_name VARCHAR(100),
  bank_code INTEGER,

  -- Taksit bilgileri
  commercial INTEGER, -- 0 veya 1

  -- Cache
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- Taksit planları (her banka için)
CREATE TABLE IF NOT EXISTS installment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  bank_name VARCHAR(100),
  bin_number VARCHAR(6),
  card_family VARCHAR(100),

  -- Taksit bilgileri
  installment_count INTEGER NOT NULL,
  installment_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2),

  -- Cache
  base_amount DECIMAL(10, 2), -- Hangi tutar için sorgulandı
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day'
);

-- Ödeme linkleri (PayWithIyzico)
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,

  -- Link bilgileri
  link_token VARCHAR(255) UNIQUE NOT NULL,
  link_url TEXT NOT NULL,

  -- Ödeme detayları
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',
  description TEXT,

  -- Durum
  status VARCHAR(20) DEFAULT 'active', -- active, paid, expired, cancelled

  -- Ödeme bilgisi
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,

  -- Geçerlilik
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ödeme raporları (günlük özet)
CREATE TABLE IF NOT EXISTS payment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  report_date DATE NOT NULL UNIQUE,

  -- Özet istatistikler
  total_transactions INTEGER DEFAULT 0,
  total_amount DECIMAL(12, 2) DEFAULT 0,
  total_commission DECIMAL(12, 2) DEFAULT 0,

  successful_transactions INTEGER DEFAULT 0,
  successful_amount DECIMAL(12, 2) DEFAULT 0,

  failed_transactions INTEGER DEFAULT 0,
  failed_amount DECIMAL(12, 2) DEFAULT 0,

  refunded_transactions INTEGER DEFAULT 0,
  refunded_amount DECIMAL(12, 2) DEFAULT 0,

  cancelled_transactions INTEGER DEFAULT 0,

  -- iyzico raporu
  iyzico_report JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_saved_cards_customer ON saved_cards(customer_id);
CREATE INDEX idx_saved_cards_token ON saved_cards(card_token);
CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_cancellations_payment ON cancellations(payment_id);
CREATE INDEX idx_marketplace_payments ON marketplace_payments(payment_id, submerchant_id);
CREATE INDEX idx_payment_links_token ON payment_links(link_token);
CREATE INDEX idx_payment_links_status ON payment_links(status);
CREATE INDEX idx_payment_reports_date ON payment_reports(report_date);

-- RLS Policies
ALTER TABLE saved_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_submerchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reports ENABLE ROW LEVEL SECURITY;

-- Kayıtlı kartlar: Müşteriler sadece kendi kartlarını görebilir
CREATE POLICY "Customers can view own saved cards"
  ON saved_cards FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can delete own saved cards"
  ON saved_cards FOR DELETE
  TO authenticated
  USING (customer_id = auth.uid());

-- İade/İptal: Sadece adminler görebilir
CREATE POLICY "Admins can manage refunds"
  ON refunds FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage cancellations"
  ON cancellations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Pazaryeri: Sadece adminler görebilir
CREATE POLICY "Admins can manage submerchants"
  ON marketplace_submerchants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Ödeme linkleri: Müşteriler kendi linklerini görebilir
CREATE POLICY "Customers can view own payment links"
  ON payment_links FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Raporlar: Sadece adminler
CREATE POLICY "Admins can view payment reports"
  ON payment_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Otomatik updated_at trigger'ları
CREATE OR REPLACE FUNCTION update_saved_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER saved_cards_updated_at
  BEFORE UPDATE ON saved_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_cards_updated_at();

CREATE OR REPLACE FUNCTION update_marketplace_submerchants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_submerchants_updated_at
  BEFORE UPDATE ON marketplace_submerchants
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_submerchants_updated_at();

-- Comments
COMMENT ON TABLE saved_cards IS 'Müşterilerin kayıtlı kredi kartları - tek tıkla ödeme';
COMMENT ON TABLE refunds IS 'İade işlemleri - tam veya kısmi iade';
COMMENT ON TABLE cancellations IS 'İptal işlemleri - ödeme iptaleri';
COMMENT ON TABLE marketplace_submerchants IS 'Pazaryeri alt üye işyerleri';
COMMENT ON TABLE marketplace_payments IS 'Pazaryeri ödemelerinde komisyon dağılımı';
COMMENT ON TABLE bin_lookups IS 'Kart BIN sorgulama cache';
COMMENT ON TABLE installment_plans IS 'Taksit planları cache';
COMMENT ON TABLE payment_links IS 'Ödeme linkleri (PayWithIyzico)';
COMMENT ON TABLE payment_reports IS 'Günlük ödeme raporları';
