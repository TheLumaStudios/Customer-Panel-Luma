-- Create hosting_packages table
CREATE TABLE IF NOT EXISTS hosting_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name VARCHAR(100) NOT NULL,
  package_code VARCHAR(50) UNIQUE NOT NULL,
  disk_space_gb INTEGER NOT NULL,
  bandwidth_gb INTEGER,
  email_accounts INTEGER,
  databases INTEGER,
  ftp_accounts INTEGER,
  ssl_certificate BOOLEAN DEFAULT false,
  backup_frequency VARCHAR(20),
  monthly_price DECIMAL(10, 2) NOT NULL,
  yearly_price DECIMAL(10, 2),
  description TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hosting_packages_package_code ON hosting_packages(package_code);
CREATE INDEX IF NOT EXISTS idx_hosting_packages_is_active ON hosting_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_hosting_packages_display_order ON hosting_packages(display_order);

-- Add comments
COMMENT ON TABLE hosting_packages IS 'Hosting package definitions and pricing';
COMMENT ON COLUMN hosting_packages.package_name IS 'Display name of the package (e.g., Basic Hosting)';
COMMENT ON COLUMN hosting_packages.package_code IS 'Unique code for the package (e.g., BASIC, PREMIUM)';
COMMENT ON COLUMN hosting_packages.disk_space_gb IS 'Disk space in GB';
COMMENT ON COLUMN hosting_packages.bandwidth_gb IS 'Monthly bandwidth in GB';
COMMENT ON COLUMN hosting_packages.email_accounts IS 'Number of email accounts included';
COMMENT ON COLUMN hosting_packages.databases IS 'Number of databases included';
COMMENT ON COLUMN hosting_packages.ftp_accounts IS 'Number of FTP accounts included';
COMMENT ON COLUMN hosting_packages.ssl_certificate IS 'Whether SSL certificate is included';
COMMENT ON COLUMN hosting_packages.backup_frequency IS 'Backup frequency (daily, weekly, monthly)';
COMMENT ON COLUMN hosting_packages.monthly_price IS 'Monthly price in TRY';
COMMENT ON COLUMN hosting_packages.yearly_price IS 'Yearly price in TRY';
COMMENT ON COLUMN hosting_packages.features IS 'Additional features as JSON array';
COMMENT ON COLUMN hosting_packages.is_active IS 'Whether package is available for sale';
COMMENT ON COLUMN hosting_packages.display_order IS 'Order for displaying packages';

-- Add package_id to hosting table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hosting' AND column_name = 'package_id'
  ) THEN
    ALTER TABLE hosting ADD COLUMN package_id UUID REFERENCES hosting_packages(id) ON DELETE SET NULL;
    CREATE INDEX idx_hosting_package_id ON hosting(package_id);
  END IF;
END $$;

-- Insert sample packages
INSERT INTO hosting_packages (package_name, package_code, disk_space_gb, bandwidth_gb, email_accounts, databases, ftp_accounts, ssl_certificate, backup_frequency, monthly_price, yearly_price, description, display_order, is_active)
VALUES
  ('Basic Hosting', 'BASIC', 10, 100, 10, 5, 5, false, 'weekly', 49.90, 499.00, 'Küçük websiteleri için ideal başlangıç paketi', 1, true),
  ('Standard Hosting', 'STANDARD', 25, 250, 25, 10, 10, true, 'daily', 99.90, 999.00, 'Orta ölçekli websiteleri için önerilen paket', 2, true),
  ('Premium Hosting', 'PREMIUM', 50, 500, 50, 25, 25, true, 'daily', 199.90, 1999.00, 'Yüksek trafikli siteler için güçlü paket', 3, true),
  ('Enterprise Hosting', 'ENTERPRISE', 100, -1, -1, -1, -1, true, 'daily', 499.90, 4999.00, 'Kurumsal projeler için sınırsız kaynaklı paket', 4, true)
ON CONFLICT (package_code) DO NOTHING;
