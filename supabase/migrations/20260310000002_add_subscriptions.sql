-- Abonelik sistemi için tablolar
-- iyzico subscription entegrasyonu

-- Abonelik planları (hosting paketlerinden otomatik oluşturulur)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hosting_package_id UUID REFERENCES hosting_packages(id) ON DELETE CASCADE,

  -- iyzico plan bilgileri
  iyzico_product_reference_code VARCHAR(255) UNIQUE,
  iyzico_pricing_plan_reference_code VARCHAR(255) UNIQUE,

  -- Plan detayları
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',
  payment_interval VARCHAR(20) DEFAULT 'MONTHLY', -- MONTHLY, WEEKLY, YEARLY
  payment_interval_count INTEGER DEFAULT 1, -- 1=aylık, 3=3 aylık, 6=6 aylık, 12=yıllık
  trial_days INTEGER DEFAULT 0,

  -- Durum
  status VARCHAR(20) DEFAULT 'active', -- active, inactive

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Müşteri abonelikleri
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  hosting_id UUID REFERENCES hosting(id) ON DELETE SET NULL,

  -- iyzico abonelik bilgileri
  iyzico_subscription_reference_code VARCHAR(255) UNIQUE,
  iyzico_customer_reference_code VARCHAR(255),

  -- Abonelik detayları
  status VARCHAR(20) DEFAULT 'active', -- active, paused, cancelled, expired, payment_failed
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,

  -- Ödeme bilgileri
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',

  -- İstatistikler
  successful_payment_count INTEGER DEFAULT 0,
  failed_payment_count INTEGER DEFAULT 0,
  total_paid DECIMAL(10, 2) DEFAULT 0,

  -- Notlar
  cancellation_reason TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abonelik ödemeleri (her başarılı/başarısız ödeme kaydedilir)
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

  -- iyzico ödeme bilgileri
  iyzico_payment_id VARCHAR(255),

  -- Ödeme detayları
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',
  status VARCHAR(20) NOT NULL, -- success, failed, pending
  payment_date TIMESTAMPTZ DEFAULT NOW(),

  -- Hata bilgileri
  error_message TEXT,
  error_code VARCHAR(50),

  -- Webhook verisi
  webhook_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_subscription_plans_hosting ON subscription_plans(hosting_package_id);
CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_payment ON subscriptions(next_payment_date);
CREATE INDEX idx_subscription_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_status ON subscription_payments(status);

-- RLS Policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Herkes plan listesini görebilir
CREATE POLICY "Everyone can view subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true);

-- Müşteriler sadece kendi aboneliklerini görebilir
CREATE POLICY "Customers can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Adminler tüm abonelikleri görebilir ve yönetebilir
CREATE POLICY "Admins can manage all subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Müşteriler kendi ödeme geçmişini görebilir
CREATE POLICY "Customers can view own subscription payments"
  ON subscription_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.id = subscription_payments.subscription_id
      AND subscriptions.customer_id = auth.uid()
    )
  );

-- Adminler tüm ödemeleri görebilir
CREATE POLICY "Admins can view all subscription payments"
  ON subscription_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Otomatik updated_at trigger'ları
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();

CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Comments
COMMENT ON TABLE subscription_plans IS 'iyzico abonelik planları - hosting paketlerinden otomatik oluşturulur';
COMMENT ON TABLE subscriptions IS 'Müşteri abonelikleri - otomatik ödeme ve yenileme';
COMMENT ON TABLE subscription_payments IS 'Abonelik ödeme geçmişi - her aylık ödeme kaydedilir';
