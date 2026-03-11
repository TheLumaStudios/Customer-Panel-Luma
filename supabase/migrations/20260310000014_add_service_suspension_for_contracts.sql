-- Hizmet askıya alma sistemi - Sözleşme onayı için
-- Onaylanmamış zorunlu sözleşmeler varsa hizmetler otomatik askıya alınır

-- Hizmet tablolarına suspension alanları ekle
ALTER TABLE hosting
ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

ALTER TABLE domains
ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

ALTER TABLE vds
ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- Müşterinin onaysız sözleşmeleri olup olmadığını kontrol eden fonksiyon
CREATE OR REPLACE FUNCTION check_customer_contract_compliance(customer_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  -- Pending durumda zorunlu sözleşme var mı?
  SELECT COUNT(*)
  INTO pending_count
  FROM customer_contracts
  WHERE customer_id = customer_id_param
    AND status = 'pending'
    AND is_mandatory = true
    AND (expires_at IS NULL OR expires_at > NOW());

  RETURN pending_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Müşterinin hizmetlerini askıya alan fonksiyon
CREATE OR REPLACE FUNCTION suspend_customer_services(customer_id_param UUID, reason TEXT)
RETURNS VOID AS $$
BEGIN
  -- Hosting hizmetlerini askıya al
  UPDATE hosting
  SET suspended = true,
      suspension_reason = reason,
      suspended_at = NOW()
  WHERE customer_id = customer_id_param
    AND suspended = false;

  -- Domain hizmetlerini askıya al
  UPDATE domains
  SET suspended = true,
      suspension_reason = reason,
      suspended_at = NOW()
  WHERE customer_id = customer_id_param
    AND suspended = false;

  -- VDS hizmetlerini askıya al
  UPDATE vds
  SET suspended = true,
      suspension_reason = reason,
      suspended_at = NOW()
  WHERE customer_id = customer_id_param
    AND suspended = false;

  RAISE NOTICE 'Customer % services suspended: %', customer_id_param, reason;
END;
$$ LANGUAGE plpgsql;

-- Müşterinin hizmetlerini aktif hale getiren fonksiyon
CREATE OR REPLACE FUNCTION activate_customer_services(customer_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Hosting hizmetlerini aktif et
  UPDATE hosting
  SET suspended = false,
      suspension_reason = NULL,
      suspended_at = NULL
  WHERE customer_id = customer_id_param
    AND suspended = true
    AND suspension_reason LIKE '%sözleşme%';

  -- Domain hizmetlerini aktif et
  UPDATE domains
  SET suspended = false,
      suspension_reason = NULL,
      suspended_at = NULL
  WHERE customer_id = customer_id_param
    AND suspended = true
    AND suspension_reason LIKE '%sözleşme%';

  -- VDS hizmetlerini aktif et
  UPDATE vds
  SET suspended = false,
      suspension_reason = NULL,
      suspended_at = NULL
  WHERE customer_id = customer_id_param
    AND suspended = true
    AND suspension_reason LIKE '%sözleşme%';

  RAISE NOTICE 'Customer % services activated', customer_id_param;
END;
$$ LANGUAGE plpgsql;

-- Sözleşme gönderildiğinde hizmetleri askıya alan trigger
CREATE OR REPLACE FUNCTION trigger_suspend_on_contract_send()
RETURNS TRIGGER AS $$
BEGIN
  -- Eğer zorunlu bir sözleşme gönderildiyse ve hizmet bağlantısı varsa
  IF NEW.is_mandatory = true AND NEW.service_id IS NOT NULL THEN
    CASE NEW.service_type
      WHEN 'hosting' THEN
        UPDATE hosting
        SET suspended = true,
            suspension_reason = 'Zorunlu sözleşme onayı bekleniyor',
            suspended_at = NOW()
        WHERE id = NEW.service_id;

      WHEN 'domain' THEN
        UPDATE domains
        SET suspended = true,
            suspension_reason = 'Zorunlu sözleşme onayı bekleniyor',
            suspended_at = NOW()
        WHERE id = NEW.service_id;

      WHEN 'vds', 'vps' THEN
        UPDATE vds
        SET suspended = true,
            suspension_reason = 'Zorunlu sözleşme onayı bekleniyor',
            suspended_at = NOW()
        WHERE id = NEW.service_id;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER suspend_on_contract_send
  AFTER INSERT ON customer_contracts
  FOR EACH ROW
  WHEN (NEW.is_mandatory = true AND NEW.service_id IS NOT NULL)
  EXECUTE FUNCTION trigger_suspend_on_contract_send();

-- Sözleşme onaylandığında hizmetleri aktif eden trigger
CREATE OR REPLACE FUNCTION trigger_activate_on_contract_approval()
RETURNS TRIGGER AS $$
DECLARE
  contract_rec RECORD;
BEGIN
  -- Onaylanan sözleşmenin bilgilerini al
  SELECT * INTO contract_rec
  FROM customer_contracts
  WHERE id = NEW.customer_contract_id;

  -- Eğer onaylandıysa ve hizmet bağlantısı varsa
  IF NEW.approval_status = 'approved' AND contract_rec.service_id IS NOT NULL THEN
    CASE contract_rec.service_type
      WHEN 'hosting' THEN
        UPDATE hosting
        SET suspended = false,
            suspension_reason = NULL,
            suspended_at = NULL
        WHERE id = contract_rec.service_id
          AND suspension_reason LIKE '%sözleşme%';

      WHEN 'domain' THEN
        UPDATE domains
        SET suspended = false,
            suspension_reason = NULL,
            suspended_at = NULL
        WHERE id = contract_rec.service_id
          AND suspension_reason LIKE '%sözleşme%';

      WHEN 'vds', 'vps' THEN
        UPDATE vds
        SET suspended = false,
            suspension_reason = NULL,
            suspended_at = NULL
        WHERE id = contract_rec.service_id
          AND suspension_reason LIKE '%sözleşme%';
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activate_on_contract_approval
  AFTER INSERT ON contract_approvals
  FOR EACH ROW
  WHEN (NEW.approval_status = 'approved')
  EXECUTE FUNCTION trigger_activate_on_contract_approval();

-- Yorumlar
COMMENT ON COLUMN hosting.suspended IS 'Hizmet askıda mı (sözleşme onayı, ödeme eksikliği vb.)';
COMMENT ON COLUMN hosting.suspension_reason IS 'Askıya alma nedeni';
COMMENT ON FUNCTION check_customer_contract_compliance IS 'Müşterinin tüm zorunlu sözleşmeleri onayladığını kontrol eder';
COMMENT ON FUNCTION suspend_customer_services IS 'Müşterinin tüm hizmetlerini askıya alır';
COMMENT ON FUNCTION activate_customer_services IS 'Müşterinin sözleşme ile askıya alınmış hizmetlerini aktif eder';
