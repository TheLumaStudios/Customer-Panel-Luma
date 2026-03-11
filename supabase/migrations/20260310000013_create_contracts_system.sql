-- Elektronik sözleşme ve onay sistemi (5070 sayılı Elektronik İmza Kanunu uyumlu)
-- İnkar edilemezlik (non-repudiation) mekanizması ile

-- Sözleşme şablonları tablosu
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Şablon bilgileri
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50) NOT NULL, -- v1.0, v2.0 etc.

  -- Sözleşme içeriği
  content TEXT NOT NULL, -- HTML veya Markdown formatında
  content_hash VARCHAR(64) NOT NULL, -- SHA-256 hash (non-repudiation için)

  -- Tip ve kategori
  type VARCHAR(50) NOT NULL, -- 'service_agreement', 'privacy_policy', 'terms_of_service', 'gdpr_consent'
  category VARCHAR(50), -- 'hosting', 'domain', 'vps', 'general'

  -- Durum
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, archived
  is_mandatory BOOLEAN DEFAULT true, -- Zorunlu onay mı?

  -- Geçerlilik
  effective_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Müşteriye gönderilen sözleşmeler
CREATE TABLE IF NOT EXISTS customer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- İlişkiler
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES contract_templates(id) ON DELETE RESTRICT,

  -- Sözleşme snapshot (şablon değişirse bile orijinal içerik korunur)
  contract_content TEXT NOT NULL,
  contract_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
  version VARCHAR(50) NOT NULL,

  -- Hizmet bağlantısı (opsiyonel)
  service_type VARCHAR(50), -- hosting, domain, vds, vps
  service_id UUID, -- İlgili hizmetin ID'si

  -- Durum
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, expired
  is_mandatory BOOLEAN DEFAULT true,

  -- Gönderen bilgisi
  sent_by UUID REFERENCES profiles(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- Son işlem tarihleri
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sözleşme onayları (non-repudiation için detaylı kayıt)
CREATE TABLE IF NOT EXISTS contract_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- İlişkiler
  customer_contract_id UUID NOT NULL REFERENCES customer_contracts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Onay bilgileri
  approval_status VARCHAR(20) NOT NULL, -- approved, rejected
  approval_text TEXT, -- Kullanıcının gördüğü onay metni
  approval_text_hash VARCHAR(64) NOT NULL, -- Onay metninin hash'i

  -- NON-REPUDIATION: İnkar edilemezlik bilgileri
  ip_address INET NOT NULL, -- Müşterinin IP adresi
  user_agent TEXT, -- Browser bilgisi
  device_fingerprint TEXT, -- Cihaz parmak izi (opsiyonel)
  geolocation JSONB, -- Coğrafi konum (opsiyonel)

  -- Dijital imza bilgileri (gelecekte e-imza entegrasyonu için)
  digital_signature TEXT, -- Dijital imza
  signature_algorithm VARCHAR(50), -- RSA, ECDSA, etc.
  certificate_info JSONB, -- Sertifika bilgileri

  -- Timestamp (Zaman damgası)
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Onay metodu
  approval_method VARCHAR(50) DEFAULT 'web_interface', -- web_interface, api, mobile_app, email

  -- Ek notlar
  notes TEXT,

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sözleşme değişiklik geçmişi
CREATE TABLE IF NOT EXISTS contract_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  customer_contract_id UUID NOT NULL REFERENCES customer_contracts(id) ON DELETE CASCADE,

  -- Değişiklik bilgisi
  action VARCHAR(50) NOT NULL, -- created, sent, approved, rejected, expired, reminded
  old_status VARCHAR(20),
  new_status VARCHAR(20),

  -- Kim yaptı
  performed_by UUID REFERENCES profiles(id),

  -- Detaylar
  details JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sözleşme hatırlatmaları
CREATE TABLE IF NOT EXISTS contract_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  customer_contract_id UUID NOT NULL REFERENCES customer_contracts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Hatırlatma bilgisi
  reminder_type VARCHAR(50) DEFAULT 'email', -- email, sms, notification
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- Durum
  status VARCHAR(20) DEFAULT 'sent', -- sent, opened, clicked

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_contract_templates_status ON contract_templates(status);
CREATE INDEX idx_contract_templates_type ON contract_templates(type);
CREATE INDEX idx_customer_contracts_customer ON customer_contracts(customer_id);
CREATE INDEX idx_customer_contracts_status ON customer_contracts(status);
CREATE INDEX idx_customer_contracts_service ON customer_contracts(service_type, service_id);
CREATE INDEX idx_contract_approvals_customer ON contract_approvals(customer_id);
CREATE INDEX idx_contract_approvals_contract ON contract_approvals(customer_contract_id);
CREATE INDEX idx_contract_history_contract ON contract_history(customer_contract_id);

-- RLS Policies
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_reminders ENABLE ROW LEVEL SECURITY;

-- Adminler ve çalışanlar tüm şablonları yönetebilir
CREATE POLICY "Admins and employees can manage templates"
  ON contract_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'employee')
    )
  );

-- Adminler ve çalışanlar tüm sözleşmeleri yönetebilir
CREATE POLICY "Admins and employees can manage contracts"
  ON customer_contracts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'employee')
    )
  );

-- Müşteriler kendi sözleşmelerini görebilir
CREATE POLICY "Customers can view their contracts"
  ON customer_contracts FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Adminler ve çalışanlar tüm onayları görebilir
CREATE POLICY "Admins and employees can view approvals"
  ON contract_approvals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'employee')
    )
  );

-- Müşteriler kendi onaylarını görebilir
CREATE POLICY "Customers can view their approvals"
  ON contract_approvals FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Müşteriler kendi onaylarını oluşturabilir
CREATE POLICY "Customers can create their approvals"
  ON contract_approvals FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Adminler ve çalışanlar geçmişi görebilir
CREATE POLICY "Admins and employees can view history"
  ON contract_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'employee')
    )
  );

-- Adminler hatırlatma gönderebilir
CREATE POLICY "Admins can manage reminders"
  ON contract_reminders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'employee')
    )
  );

-- Otomatik updated_at trigger
CREATE OR REPLACE FUNCTION update_contract_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_templates_updated_at
  BEFORE UPDATE ON contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_templates_updated_at();

CREATE OR REPLACE FUNCTION update_customer_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_contracts_updated_at
  BEFORE UPDATE ON customer_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_contracts_updated_at();

-- Sözleşme onaylandığında otomatik history kaydı
CREATE OR REPLACE FUNCTION log_contract_approval()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO contract_history (
    customer_contract_id,
    action,
    old_status,
    new_status,
    details
  ) VALUES (
    NEW.customer_contract_id,
    CASE
      WHEN NEW.approval_status = 'approved' THEN 'approved'
      WHEN NEW.approval_status = 'rejected' THEN 'rejected'
    END,
    NULL,
    NEW.approval_status,
    jsonb_build_object(
      'ip_address', host(NEW.ip_address),
      'user_agent', NEW.user_agent,
      'approved_at', NEW.approved_at
    )
  );

  -- Sözleşme durumunu güncelle
  UPDATE customer_contracts
  SET status = NEW.approval_status,
      updated_at = NOW()
  WHERE id = NEW.customer_contract_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_contract_approval_trigger
  AFTER INSERT ON contract_approvals
  FOR EACH ROW
  EXECUTE FUNCTION log_contract_approval();

-- Yorumlar
COMMENT ON TABLE contract_templates IS 'Sözleşme şablonları';
COMMENT ON TABLE customer_contracts IS 'Müşterilere gönderilen sözleşmeler';
COMMENT ON TABLE contract_approvals IS 'Sözleşme onayları - İnkar edilemezlik kayıtları';
COMMENT ON TABLE contract_history IS 'Sözleşme değişiklik geçmişi';
COMMENT ON COLUMN contract_approvals.ip_address IS 'Onaylayan müşterinin IP adresi (non-repudiation)';
COMMENT ON COLUMN contract_approvals.user_agent IS 'Onaylayan cihazın browser bilgisi (non-repudiation)';
COMMENT ON COLUMN contract_approvals.approval_text_hash IS 'Onay metninin SHA-256 hash değeri (non-repudiation)';
COMMENT ON COLUMN contract_approvals.digital_signature IS 'Dijital imza (gelecekte e-imza entegrasyonu için)';
