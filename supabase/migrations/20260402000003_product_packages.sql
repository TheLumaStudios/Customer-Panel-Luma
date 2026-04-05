-- Product packages table for all product types
CREATE TABLE IF NOT EXISTS product_packages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Product categorization
  product_type text NOT NULL CHECK (product_type IN ('vds', 'vps', 'dedicated', 'cpanel_hosting', 'plesk_hosting', 'reseller_hosting', 'wordpress_hosting', 'game_minecraft', 'game_csgo')),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,

  -- Specs
  cpu_cores integer,
  cpu_model text,
  ram_gb integer,
  ram_type text, -- 'DDR4', 'DDR5'
  disk_gb integer,
  disk_type text, -- 'NVMe SSD', 'SSD', 'HDD', 'RAID 1'
  bandwidth text, -- '10 Gbit', '1 TB', 'Limitsiz'

  -- Hosting specific
  domains_allowed integer,
  email_accounts text, -- 'Limitsiz', '100' etc
  databases text, -- 'Limitsiz', '10' etc
  control_panel text, -- 'cPanel', 'Plesk', null

  -- Game server specific
  player_slots integer,

  -- Additional features (stored as JSON array)
  features jsonb DEFAULT '[]',

  -- Pricing
  cost_monthly numeric(12,2) DEFAULT 0, -- Our cost (maliyet)
  price_monthly numeric(12,2) NOT NULL, -- Selling price
  price_original numeric(12,2), -- Original/crossed out price (for discount display)
  price_quarterly numeric(12,2),
  price_semi_annual numeric(12,2),
  price_annual numeric(12,2),
  currency text DEFAULT 'TRY',
  tax_included boolean DEFAULT false, -- +KDV flag

  -- Display
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  badge_text text, -- 'En Popüler', 'Yeni', 'KAMPANYA'

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE product_packages ENABLE ROW LEVEL SECURITY;

-- Everyone can read active packages (for landing pages)
CREATE POLICY "Anyone can view active product_packages"
  ON product_packages FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admins can manage all
CREATE POLICY "Admins can manage product_packages"
  ON product_packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_packages_type ON product_packages(product_type);
CREATE INDEX IF NOT EXISTS idx_product_packages_active ON product_packages(is_active, product_type);
CREATE INDEX IF NOT EXISTS idx_product_packages_sort ON product_packages(product_type, sort_order);

-- =============================================
-- SEED DATA: VDS Packages (20 packages)
-- =============================================
INSERT INTO product_packages (product_type, name, slug, cpu_cores, cpu_model, ram_gb, ram_type, disk_gb, disk_type, bandwidth, price_monthly, price_original, currency, tax_included, sort_order, features) VALUES
('vds', 'VDS-L-TR 1 GB', 'vds-l-tr-1gb', 1, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 1, 'DDR4', 30, 'NVMe SSD', '10 Gbit', 99.90, 105, 'TRY', false, 1, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 2 GB', 'vds-l-tr-2gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 2, 'DDR4', 30, 'NVMe SSD', '10 Gbit', 104.90, 110, 'TRY', false, 2, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 3 GB', 'vds-l-tr-3gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 3, 'DDR4', 30, 'NVMe SSD', '10 Gbit', 119.90, 125, 'TRY', false, 3, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 4 GB', 'vds-l-tr-4gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 4, 'DDR4', 40, 'NVMe SSD', '10 Gbit', 134.90, 140, 'TRY', false, 4, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 5 GB', 'vds-l-tr-5gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 5, 'DDR4', 40, 'NVMe SSD', '10 Gbit', 149.90, 155, 'TRY', false, 5, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 6 GB', 'vds-l-tr-6gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 6, 'DDR4', 50, 'NVMe SSD', '10 Gbit', 164.90, 170, 'TRY', false, 6, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 7 GB', 'vds-l-tr-7gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 7, 'DDR4', 50, 'NVMe SSD', '10 Gbit', 179.90, 185, 'TRY', false, 7, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 8 GB', 'vds-l-tr-8gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 8, 'DDR4', 60, 'NVMe SSD', '10 Gbit', 194.90, 200, 'TRY', false, 8, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 9 GB', 'vds-l-tr-9gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 9, 'DDR4', 60, 'NVMe SSD', '10 Gbit', 209.90, 215, 'TRY', false, 9, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 10 GB', 'vds-l-tr-10gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 10, 'DDR4', 70, 'NVMe SSD', '10 Gbit', 224.90, 230, 'TRY', false, 10, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 11 GB', 'vds-l-tr-11gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 11, 'DDR4', 70, 'NVMe SSD', '10 Gbit', 239.90, 245, 'TRY', false, 11, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 12 GB', 'vds-l-tr-12gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 12, 'DDR4', 80, 'NVMe SSD', '10 Gbit', 254.90, 260, 'TRY', false, 12, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 13 GB', 'vds-l-tr-13gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 13, 'DDR4', 80, 'NVMe SSD', '10 Gbit', 269.90, 275, 'TRY', false, 13, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 14 GB', 'vds-l-tr-14gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 14, 'DDR4', 90, 'NVMe SSD', '10 Gbit', 284.90, 290, 'TRY', false, 14, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 15 GB', 'vds-l-tr-15gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 15, 'DDR4', 90, 'NVMe SSD', '10 Gbit', 299.90, 305, 'TRY', false, 15, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 16 GB', 'vds-l-tr-16gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 16, 'DDR4', 90, 'NVMe SSD', '10 Gbit', 314.90, 320, 'TRY', false, 16, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 24 GB', 'vds-l-tr-24gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 24, 'DDR4', 120, 'NVMe SSD', '10 Gbit', 434.90, 440, 'TRY', false, 17, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 32 GB', 'vds-l-tr-32gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 32, 'DDR4', 180, 'NVMe SSD', '10 Gbit', 554.90, 560, 'TRY', false, 18, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 48 GB', 'vds-l-tr-48gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 48, 'DDR4', 220, 'NVMe SSD', '10 Gbit', 794.90, 800, 'TRY', false, 19, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]'),
('vds', 'VDS-L-TR 64 GB', 'vds-l-tr-64gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 64, 'DDR4', 280, 'NVMe SSD', '10 Gbit', 1034.90, 1040, 'TRY', false, 20, '["Tam Root Erişim", "KVM Sanallaştırma", "7/24 Destek"]')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SEED DATA: VPS Packages (16 packages)
-- =============================================
INSERT INTO product_packages (product_type, name, slug, cpu_cores, cpu_model, ram_gb, ram_type, disk_gb, disk_type, bandwidth, price_monthly, price_original, currency, tax_included, sort_order, features) VALUES
('vps', 'VPS-L-TR 1 GB', 'vps-l-tr-1gb', 1, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 1, 'DDR4', 20, 'NVMe SSD', '10 Gbit', 84.90, 90, 'TRY', false, 1, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 2 GB', 'vps-l-tr-2gb', 1, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 2, 'DDR4', 30, 'NVMe SSD', '10 Gbit', 99.90, 105, 'TRY', false, 2, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 3 GB', 'vps-l-tr-3gb', 2, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 3, 'DDR4', 35, 'NVMe SSD', '10 Gbit', 114.90, 120, 'TRY', false, 3, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 4 GB', 'vps-l-tr-4gb', 2, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 4, 'DDR4', 40, 'NVMe SSD', '10 Gbit', 129.90, 135, 'TRY', false, 4, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 5 GB', 'vps-l-tr-5gb', 3, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 5, 'DDR4', 45, 'NVMe SSD', '10 Gbit', 144.90, 150, 'TRY', false, 5, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 6 GB', 'vps-l-tr-6gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 6, 'DDR4', 50, 'NVMe SSD', '10 Gbit', 159.90, 165, 'TRY', false, 6, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 7 GB', 'vps-l-tr-7gb', 4, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 7, 'DDR4', 55, 'NVMe SSD', '10 Gbit', 174.90, 180, 'TRY', false, 7, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 8 GB', 'vps-l-tr-8gb', 6, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 8, 'DDR4', 60, 'NVMe SSD', '10 Gbit', 189.90, 195, 'TRY', false, 8, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 9 GB', 'vps-l-tr-9gb', 6, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 9, 'DDR4', 65, 'NVMe SSD', '10 Gbit', 204.90, 210, 'TRY', false, 9, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 10 GB', 'vps-l-tr-10gb', 6, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 10, 'DDR4', 70, 'NVMe SSD', '10 Gbit', 219.90, 225, 'TRY', false, 10, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 11 GB', 'vps-l-tr-11gb', 6, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 11, 'DDR4', 75, 'NVMe SSD', '10 Gbit', 234.90, 240, 'TRY', false, 11, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 12 GB', 'vps-l-tr-12gb', 8, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 12, 'DDR4', 80, 'NVMe SSD', '10 Gbit', 249.90, 255, 'TRY', false, 12, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 13 GB', 'vps-l-tr-13gb', 8, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 13, 'DDR4', 85, 'NVMe SSD', '10 Gbit', 264.90, 270, 'TRY', false, 13, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 14 GB', 'vps-l-tr-14gb', 8, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 14, 'DDR4', 90, 'NVMe SSD', '10 Gbit', 279.90, 285, 'TRY', false, 14, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 15 GB', 'vps-l-tr-15gb', 8, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 15, 'DDR4', 95, 'NVMe SSD', '10 Gbit', 294.90, 300, 'TRY', false, 15, '["Tam Root Erişim", "7/24 Destek"]'),
('vps', 'VPS-L-TR 16 GB', 'vps-l-tr-16gb', 8, 'Xeon Platinum 8168 / Xeon Gold 6152 / Xeon E5 2699 v4', 16, 'DDR4', 100, 'NVMe SSD', '10 Gbit', 309.90, 315, 'TRY', false, 16, '["Tam Root Erişim", "7/24 Destek"]')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SEED DATA: Dedicated Servers (3 packages)
-- =============================================
INSERT INTO product_packages (product_type, name, slug, cpu_cores, cpu_model, ram_gb, ram_type, disk_gb, disk_type, bandwidth, price_monthly, price_annual, currency, tax_included, sort_order, features, badge_text) VALUES
('dedicated', 'TR-RYZEN-59X', 'tr-ryzen-59x', 16, 'AMD Ryzen 9 5950X (3.7 GHz / 4.8 GHz Turbo)', 128, 'DDR4', 2000, 'NVMe RAID 1', '10 Gbit', 7000, 75600, 'TRY', false, 1, '["128 GB MAX RAM", "DDoS Koruması", "7/24 Destek", "Tam Root Erişim"]', NULL),
('dedicated', 'TR-RYZEN-56X', 'tr-ryzen-56x', 6, 'AMD Ryzen 5 5600X (3.7 GHz / 4.6 GHz Turbo)', 128, 'DDR4', 1000, 'RAID 1', '10 Gbit', 4000, 45600, 'TRY', false, 2, '["128 GB MAX RAM", "DDoS Koruması", "7/24 Destek", "Tam Root Erişim"]', NULL),
('dedicated', 'TR-RYZEN-56G', 'tr-ryzen-56g', 6, 'AMD Ryzen 5 5600G (3.9 GHz / 4.4 GHz Turbo)', 32, 'DDR4', 1000, 'RAID 1', '10 Gbit', 3000, 34200, 'TRY', false, 3, '["128 GB MAX RAM", "DDoS Koruması", "7/24 Destek", "Tam Root Erişim"]', NULL)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SEED DATA: cPanel Hosting (4 packages)
-- =============================================
-- Note: disk_gb = -1 means "Sınırsız"
INSERT INTO product_packages (product_type, name, slug, disk_gb, disk_type, bandwidth, domains_allowed, email_accounts, databases, control_panel, price_monthly, currency, tax_included, sort_order, features) VALUES
('cpanel_hosting', 'cPanel Paket 1', 'cpanel-paket-1', 10, 'SSD', 'Limitsiz', 1, 'Limitsiz', 'Limitsiz', 'cPanel', 20.00, 'TRY', true, 1, '["CloudLinux Yönetimi", "CageFS Eklentisi", "Imunify360 Eklentisi", "Softaculous Eklentisi", "1 Site Ücretsiz Taşıma", "Ücretsiz SSL", "Limitsiz Alt Alan Adı"]'),
('cpanel_hosting', 'cPanel Paket 2', 'cpanel-paket-2', 20, 'SSD', 'Limitsiz', 2, 'Limitsiz', 'Limitsiz', 'cPanel', 30.00, 'TRY', true, 2, '["CloudLinux Yönetimi", "CageFS Eklentisi", "Imunify360 Eklentisi", "Softaculous Eklentisi", "1 Site Ücretsiz Taşıma", "Ücretsiz SSL", "Limitsiz Alt Alan Adı"]'),
('cpanel_hosting', 'cPanel Paket 3', 'cpanel-paket-3', -1, 'SSD', 'Limitsiz', 4, 'Limitsiz', 'Limitsiz', 'cPanel', 40.00, 'TRY', true, 3, '["CloudLinux Yönetimi", "CageFS Eklentisi", "Imunify360 Eklentisi", "Softaculous Eklentisi", "1 Site Ücretsiz Taşıma", "Ücretsiz SSL", "Limitsiz Alt Alan Adı"]'),
('cpanel_hosting', 'cPanel Paket 4', 'cpanel-paket-4', -1, 'SSD', 'Limitsiz', 5, 'Limitsiz', 'Limitsiz', 'cPanel', 50.00, 'TRY', true, 4, '["CloudLinux Yönetimi", "CageFS Eklentisi", "Imunify360 Eklentisi", "Softaculous Eklentisi", "1 Site Ücretsiz Taşıma", "Ücretsiz SSL", "Limitsiz Alt Alan Adı"]')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SEED DATA: Plesk Hosting (4 packages)
-- =============================================
INSERT INTO product_packages (product_type, name, slug, disk_gb, disk_type, bandwidth, domains_allowed, email_accounts, databases, control_panel, price_monthly, currency, tax_included, sort_order, features) VALUES
('plesk_hosting', 'Plesk Paket 1', 'plesk-paket-1', 10, 'SSD', 'Limitsiz', 1, 'Limitsiz', 'Limitsiz', 'Plesk', 20.00, 'TRY', true, 1, '["1 Site Ücretsiz Taşıma", "Ücretsiz SSL", "Limitsiz Alt Alan Adı"]'),
('plesk_hosting', 'Plesk Paket 2', 'plesk-paket-2', 20, 'SSD', 'Limitsiz', 2, 'Limitsiz', 'Limitsiz', 'Plesk', 30.00, 'TRY', true, 2, '["1 Site Ücretsiz Taşıma", "Ücretsiz SSL", "Limitsiz Alt Alan Adı"]'),
('plesk_hosting', 'Plesk Paket 3', 'plesk-paket-3', -1, 'SSD', 'Limitsiz', 4, 'Limitsiz', 'Limitsiz', 'Plesk', 40.00, 'TRY', true, 3, '["1 Site Ücretsiz Taşıma", "Ücretsiz SSL", "Limitsiz Alt Alan Adı"]'),
('plesk_hosting', 'Plesk Paket 4', 'plesk-paket-4', -1, 'SSD', 'Limitsiz', 5, 'Limitsiz', 'Limitsiz', 'Plesk', 50.00, 'TRY', true, 4, '["1 Site Ücretsiz Taşıma", "Ücretsiz SSL", "Limitsiz Alt Alan Adı"]')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SEED DATA: Reseller Hosting (4 packages)
-- =============================================
INSERT INTO product_packages (product_type, name, slug, disk_gb, disk_type, bandwidth, domains_allowed, email_accounts, databases, control_panel, price_monthly, currency, tax_included, sort_order, features) VALUES
('reseller_hosting', 'Reseller Paket 1', 'reseller-paket-1', -1, 'SSD', 'Limitsiz', 10, 'Limitsiz', 'Limitsiz', 'cPanel', 100.00, 'TRY', true, 1, '["LiteSpeed WebServer", "CloudLinux Yönetimi", "CageFS Eklentisi", "Imunify360 Eklentisi", "Softaculous Eklentisi", "Ücretsiz Taşıma", "Ücretsiz SSL"]'),
('reseller_hosting', 'Reseller Paket 2', 'reseller-paket-2', -1, 'SSD', 'Limitsiz', 20, 'Limitsiz', 'Limitsiz', 'cPanel', 150.00, 'TRY', true, 2, '["LiteSpeed WebServer", "CloudLinux Yönetimi", "CageFS Eklentisi", "Imunify360 Eklentisi", "Softaculous Eklentisi", "Ücretsiz Taşıma", "Ücretsiz SSL"]'),
('reseller_hosting', 'Reseller Paket 3', 'reseller-paket-3', -1, 'SSD', 'Limitsiz', 30, 'Limitsiz', 'Limitsiz', 'cPanel', 200.00, 'TRY', true, 3, '["LiteSpeed WebServer", "CloudLinux Yönetimi", "CageFS Eklentisi", "Imunify360 Eklentisi", "Softaculous Eklentisi", "Ücretsiz Taşıma", "Ücretsiz SSL"]'),
('reseller_hosting', 'Reseller Paket 4', 'reseller-paket-4', -1, 'SSD', 'Limitsiz', 50, 'Limitsiz', 'Limitsiz', 'cPanel', 300.00, 'TRY', true, 4, '["LiteSpeed WebServer", "CloudLinux Yönetimi", "CageFS Eklentisi", "Imunify360 Eklentisi", "Softaculous Eklentisi", "Ücretsiz Taşıma", "Ücretsiz SSL"]')
ON CONFLICT (slug) DO NOTHING;
