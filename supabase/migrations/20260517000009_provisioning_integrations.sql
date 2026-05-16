-- SaaS Provisioning Kiti
-- Harici servis sağlayıcılarıyla genel amaçlı API entegrasyonu

CREATE TABLE IF NOT EXISTS provisioning_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,              -- "Plesk Lisans", "DirectAdmin", "cPanel DNSONLY"
  provider text NOT NULL,          -- 'plesk' | 'directadmin' | 'generic_http'
  is_active boolean NOT NULL DEFAULT true,
  -- HTTP endpoint bilgileri
  endpoint_url text NOT NULL,
  auth_type text NOT NULL DEFAULT 'bearer'  -- 'bearer' | 'basic' | 'api_key' | 'none'
    CHECK (auth_type IN ('bearer', 'basic', 'api_key', 'none')),
  auth_header text,                -- Header adı (ör. 'Authorization', 'X-API-Key')
  -- Kimlik bilgileri şifreli saklanır (pgcrypto)
  credentials_encrypted text,     -- pgp_sym_encrypt ile şifrelenmiş JSON
  -- Dinamik alan haritası: hangi alanlar hangi API parametrelerine map edilir
  field_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Sağlama ve askıya alma endpoint path'leri
  provision_path text,             -- POST /api/licenses/create
  suspend_path text,               -- POST /api/licenses/suspend
  terminate_path text,             -- DELETE /api/licenses/{id}
  status_path text,                -- GET /api/licenses/{id}
  -- Webhook: sağlama tamamlandığında bildir
  notify_webhook boolean NOT NULL DEFAULT false,
  -- Metadata
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sağlama log'ları
CREATE TABLE IF NOT EXISTS provisioning_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES provisioning_integrations(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('provision', 'suspend', 'terminate', 'status_check')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  request_body jsonb,
  response_status integer,
  response_body jsonb,
  error_message text,
  external_id text,   -- Harici sistemdeki kayıt ID'si
  executed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provisioning_logs_integration
  ON provisioning_logs(integration_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_provisioning_logs_customer
  ON provisioning_logs(customer_id, executed_at DESC);

COMMENT ON TABLE provisioning_integrations IS 'SaaS/lisans sağlayıcılarıyla genel HTTP entegrasyon tanımları';
COMMENT ON TABLE provisioning_logs IS 'Sağlama işlemlerinin audit log''u';
