-- Update hosting_packages table with WHMCS-style features
ALTER TABLE hosting_packages
  -- Pricing periods
  ADD COLUMN IF NOT EXISTS setup_fee DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quarterly_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS semiannually_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS biennially_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS triennially_price DECIMAL(10, 2),

  -- Payment type
  ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'recurring' CHECK (payment_type IN ('free', 'onetime', 'recurring')),

  -- Product settings
  ADD COLUMN IF NOT EXISTS product_group VARCHAR(50),
  ADD COLUMN IF NOT EXISTS welcome_email TEXT,
  ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS retired BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_domain BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_subdomain BOOLEAN DEFAULT false,

  -- Stock control
  ADD COLUMN IF NOT EXISTS stock_control BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER,

  -- Auto setup
  ADD COLUMN IF NOT EXISTS auto_setup VARCHAR(20) DEFAULT 'payment' CHECK (auto_setup IN ('on', 'payment', 'order', 'off')),

  -- Module settings (for cPanel/WHM, Plesk etc integration)
  ADD COLUMN IF NOT EXISTS module_name VARCHAR(50),
  ADD COLUMN IF NOT EXISTS module_settings JSONB,

  -- Suspension/Termination
  ADD COLUMN IF NOT EXISTS suspend_days INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS terminate_days INTEGER DEFAULT 30,

  -- Product features (rich text)
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS full_description TEXT,
  ADD COLUMN IF NOT EXISTS features_list JSONB,

  -- Upgrades
  ADD COLUMN IF NOT EXISTS upgrade_packages JSONB,

  -- Tax
  ADD COLUMN IF NOT EXISTS tax_included BOOLEAN DEFAULT false,

  -- Promo codes
  ADD COLUMN IF NOT EXISTS promo_pricing JSONB;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hosting_packages_product_group ON hosting_packages(product_group);
CREATE INDEX IF NOT EXISTS idx_hosting_packages_hidden ON hosting_packages(hidden);
CREATE INDEX IF NOT EXISTS idx_hosting_packages_payment_type ON hosting_packages(payment_type);

-- Create configurable_options table (like WHMCS)
CREATE TABLE IF NOT EXISTS configurable_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_name VARCHAR(100) NOT NULL,
  option_type VARCHAR(20) NOT NULL CHECK (option_type IN ('quantity', 'dropdown', 'radio', 'yesno')),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create configurable_option_values table
CREATE TABLE IF NOT EXISTS configurable_option_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID REFERENCES configurable_options(id) ON DELETE CASCADE,
  option_value VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  hidden BOOLEAN DEFAULT false,
  -- Pricing per period
  monthly_price DECIMAL(10, 2) DEFAULT 0,
  quarterly_price DECIMAL(10, 2),
  semiannually_price DECIMAL(10, 2),
  yearly_price DECIMAL(10, 2),
  biennially_price DECIMAL(10, 2),
  triennially_price DECIMAL(10, 2),
  setup_fee DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link configurable options to packages
CREATE TABLE IF NOT EXISTS package_configurable_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES hosting_packages(id) ON DELETE CASCADE,
  option_id UUID REFERENCES configurable_options(id) ON DELETE CASCADE,
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(package_id, option_id)
);

-- Create product addons table
CREATE TABLE IF NOT EXISTS product_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_name VARCHAR(100) NOT NULL,
  description TEXT,
  module_name VARCHAR(50),
  -- Pricing
  monthly_price DECIMAL(10, 2),
  quarterly_price DECIMAL(10, 2),
  semiannually_price DECIMAL(10, 2),
  yearly_price DECIMAL(10, 2),
  biennially_price DECIMAL(10, 2),
  triennially_price DECIMAL(10, 2),
  setup_fee DECIMAL(10, 2) DEFAULT 0,
  -- Settings
  is_active BOOLEAN DEFAULT true,
  tax_included BOOLEAN DEFAULT false,
  show_on_order BOOLEAN DEFAULT true,
  downloads JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link addons to packages
CREATE TABLE IF NOT EXISTS package_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES hosting_packages(id) ON DELETE CASCADE,
  addon_id UUID REFERENCES product_addons(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(package_id, addon_id)
);

-- Create product_groups table
CREATE TABLE IF NOT EXISTS product_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  hidden BOOLEAN DEFAULT false,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_fields table (for package-specific custom fields)
CREATE TABLE IF NOT EXISTS package_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES hosting_packages(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  field_type VARCHAR(20) CHECK (field_type IN ('text', 'password', 'dropdown', 'textarea', 'tickbox')),
  description TEXT,
  options JSONB, -- For dropdown options
  required BOOLEAN DEFAULT false,
  show_on_order BOOLEAN DEFAULT true,
  show_on_invoice BOOLEAN DEFAULT false,
  admin_only BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
COMMENT ON COLUMN hosting_packages.setup_fee IS 'One-time setup fee';
COMMENT ON COLUMN hosting_packages.payment_type IS 'free, onetime, or recurring';
COMMENT ON COLUMN hosting_packages.product_group IS 'Product group for categorization';
COMMENT ON COLUMN hosting_packages.welcome_email IS 'Welcome email template';
COMMENT ON COLUMN hosting_packages.hidden IS 'Hidden from order form';
COMMENT ON COLUMN hosting_packages.retired IS 'Retired product (existing only)';
COMMENT ON COLUMN hosting_packages.requires_domain IS 'Requires domain to order';
COMMENT ON COLUMN hosting_packages.allow_subdomain IS 'Allow subdomain registration';
COMMENT ON COLUMN hosting_packages.stock_control IS 'Enable stock control';
COMMENT ON COLUMN hosting_packages.stock_quantity IS 'Available stock quantity';
COMMENT ON COLUMN hosting_packages.auto_setup IS 'Auto setup trigger: on, payment, order, off';
COMMENT ON COLUMN hosting_packages.module_name IS 'Server module name (cpanel, plesk, etc)';
COMMENT ON COLUMN hosting_packages.module_settings IS 'Module-specific settings as JSON';
COMMENT ON COLUMN hosting_packages.suspend_days IS 'Days before suspension after invoice due';
COMMENT ON COLUMN hosting_packages.terminate_days IS 'Days before termination after invoice due';
COMMENT ON COLUMN hosting_packages.short_description IS 'Short product description';
COMMENT ON COLUMN hosting_packages.full_description IS 'Full product description (rich text)';
COMMENT ON COLUMN hosting_packages.features_list IS 'List of features as JSON array';
COMMENT ON COLUMN hosting_packages.upgrade_packages IS 'Available upgrade packages as JSON';

COMMENT ON TABLE configurable_options IS 'WHMCS-style configurable options';
COMMENT ON TABLE configurable_option_values IS 'Values for configurable options with pricing';
COMMENT ON TABLE product_addons IS 'Product addons like backup, SSL, etc';
COMMENT ON TABLE product_groups IS 'Product groups for categorization';
COMMENT ON TABLE package_custom_fields IS 'Custom fields for packages';

-- Insert sample product group
INSERT INTO product_groups (group_name, description, display_order)
VALUES
  ('Web Hosting', 'Genel web hosting paketleri', 1),
  ('Reseller Hosting', 'Bayi hosting paketleri', 2),
  ('VPS Hosting', 'Sanal sunucu paketleri', 3)
ON CONFLICT (group_name) DO NOTHING;

-- Insert sample configurable options
INSERT INTO configurable_options (option_name, option_type, description, display_order)
VALUES
  ('Disk Alanı Ekleme', 'dropdown', 'Ek disk alanı seçenekleri', 1),
  ('Yedekleme Hizmeti', 'yesno', 'Günlük otomatik yedekleme', 2),
  ('Dedicated IP', 'yesno', 'Özel IP adresi', 3)
ON CONFLICT DO NOTHING;

-- Insert sample addon
INSERT INTO product_addons (addon_name, description, monthly_price, yearly_price, setup_fee, show_on_order)
VALUES
  ('SSL Sertifikası', 'Lets Encrypt SSL sertifikası kurulumu', 0, 0, 0, true),
  ('Site Yedekleme', 'Günlük otomatik site yedekleme', 29.90, 299.00, 0, true),
  ('Site Taşıma', 'Ücretsiz site taşıma hizmeti', 0, 0, 99.00, true)
ON CONFLICT DO NOTHING;
