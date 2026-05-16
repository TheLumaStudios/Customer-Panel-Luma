-- Usage-Based Billing Altyapısı
-- VDS bandwidth ve storage aşımı için metered billing

-- Bireysel kullanım kayıtları
CREATE TABLE IF NOT EXISTS usage_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id uuid,          -- hosting.id, vds_packages.id, domains.id
  service_type text NOT NULL CHECK (service_type IN ('hosting', 'vds', 'domain')),
  metric_type text NOT NULL CHECK (metric_type IN ('bandwidth_gb', 'storage_gb', 'api_calls', 'emails_sent')),
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  period_start timestamptz NOT NULL, -- Hangi fatura dönemine ait (ay başı)
  period_end timestamptz NOT NULL,   -- Ay sonu
  invoiced boolean NOT NULL DEFAULT false,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Birden fazla kayıt yerine upsert edebilmek için unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_metrics_unique
  ON usage_metrics(customer_id, service_id, metric_type, period_start);

-- Fatura bekleyen metrikleri hızlı bulmak için
CREATE INDEX IF NOT EXISTS idx_usage_metrics_pending
  ON usage_metrics(invoiced, period_start)
  WHERE invoiced = false;

CREATE INDEX IF NOT EXISTS idx_usage_metrics_service
  ON usage_metrics(service_id, metric_type);

-- Servis tipine göre birim fiyat ve dahil edilen miktar
CREATE TABLE IF NOT EXISTS usage_billing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text NOT NULL CHECK (service_type IN ('hosting', 'vds', 'domain', '*')),
  metric_type text NOT NULL CHECK (metric_type IN ('bandwidth_gb', 'storage_gb', 'api_calls', 'emails_sent')),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),  -- TRY / birim
  included_units numeric NOT NULL DEFAULT 0,             -- Dahil (ücretsiz) miktar
  currency text NOT NULL DEFAULT 'TRY',
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Varsayılan kural: VDS bandwidth aşımı (1 GB = 0.50 TRY, dahil: 1000 GB)
INSERT INTO usage_billing_rules (service_type, metric_type, unit_price, included_units, description)
VALUES
  ('vds',     'bandwidth_gb', 0.50, 1000, 'VDS bandwidth aşımı — aylık 1 TB dahil, fazlası GB başına'),
  ('hosting', 'bandwidth_gb', 0.25, 100,  'Hosting bandwidth aşımı — aylık 100 GB dahil'),
  ('hosting', 'storage_gb',   1.00, 10,   'Hosting disk aşımı — paket limitinin üzeri GB başına')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE usage_metrics IS 'Müşteri başına metered kullanım kayıtları (bandwidth, storage, API)';
COMMENT ON TABLE usage_billing_rules IS 'Usage-based faturalandırma için birim fiyat kuralları';
