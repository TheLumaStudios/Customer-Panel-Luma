-- VDS/VPS sipariş tablosu
-- Müşteri sipariş verir → ödeme yapar → bu tabloya "paid_pending" olarak düşer
-- Admin onaylar → Yöncü API ile sunucu açılır veya admin manuel bilgi girer
-- Benzer yapı: domain_orders

CREATE TABLE IF NOT EXISTS vds_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  -- Sipariş detayları (invoice_items'dan)
  package_id UUID REFERENCES product_packages(id),
  package_name TEXT,

  -- İstenilen özellikler
  cpu_cores INTEGER,
  ram_gb INTEGER,
  disk_space_gb INTEGER,
  bandwidth_gb INTEGER,
  vds_type VARCHAR(20) DEFAULT 'VDS', -- VDS, VPS, Dedicated
  os_template TEXT,
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  monthly_price NUMERIC(10,2),

  -- Sipariş durumu
  order_status VARCHAR(30) DEFAULT 'pending',
  -- pending          = ödeme bekleniyor
  -- paid_pending     = ödeme yapıldı, admin onayı bekleniyor
  -- provisioning     = admin onayladı, sunucu açılıyor
  -- completed        = sunucu açıldı, VDS kaydı oluşturuldu
  -- failed           = sunucu açılamadı
  -- cancelled        = iptal edildi

  -- Admin tarafından doldurulan alanlar
  assigned_vds_id UUID REFERENCES vds(id),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,

  -- Yöncü API bilgileri
  yoncu_server_id TEXT,
  yoncu_response JSONB,
  error_message TEXT,

  -- Provisioned server details (admin fills or API returns)
  provisioned_ip TEXT,
  provisioned_username TEXT,
  provisioned_password TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vds_orders_invoice ON vds_orders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_vds_orders_customer ON vds_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_vds_orders_status ON vds_orders(order_status);

-- RLS
ALTER TABLE vds_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vds_orders"
  ON vds_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert vds_orders"
  ON vds_orders FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update vds_orders"
  ON vds_orders FOR UPDATE TO authenticated USING (true);

COMMENT ON TABLE vds_orders IS 'VDS/VPS sipariş kuyruğu. Ödeme sonrası admin onayı ile sunucu açılır.';
