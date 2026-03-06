-- Quick fix: Check if table exists and create with basic columns
DROP TABLE IF EXISTS hosting_packages CASCADE;

CREATE TABLE hosting_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name VARCHAR(100) NOT NULL,
  package_code VARCHAR(50) UNIQUE NOT NULL,
  disk_space_gb INTEGER NOT NULL,
  bandwidth_gb INTEGER DEFAULT 0,
  email_accounts INTEGER DEFAULT 0,
  databases INTEGER DEFAULT 0,
  ftp_accounts INTEGER DEFAULT 0,
  ssl_certificate BOOLEAN DEFAULT false,
  backup_frequency VARCHAR(20) DEFAULT 'weekly',
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
CREATE INDEX idx_hosting_packages_package_code ON hosting_packages(package_code);
CREATE INDEX idx_hosting_packages_is_active ON hosting_packages(is_active);
CREATE INDEX idx_hosting_packages_display_order ON hosting_packages(display_order);

-- Insert sample packages
INSERT INTO hosting_packages (package_name, package_code, disk_space_gb, bandwidth_gb, email_accounts, databases, ftp_accounts, ssl_certificate, backup_frequency, monthly_price, yearly_price, description, display_order, is_active)
VALUES
  ('Basic Hosting', 'BASIC', 10, 100, 10, 5, 5, false, 'weekly', 49.90, 499.00, 'Küçük websiteleri için ideal başlangıç paketi', 1, true),
  ('Standard Hosting', 'STANDARD', 25, 250, 25, 10, 10, true, 'daily', 99.90, 999.00, 'Orta ölçekli websiteleri için önerilen paket', 2, true),
  ('Premium Hosting', 'PREMIUM', 50, 500, 50, 25, 25, true, 'daily', 199.90, 1999.00, 'Yüksek trafikli siteler için güçlü paket', 3, true),
  ('Enterprise Hosting', 'ENTERPRISE', 100, -1, -1, -1, -1, true, 'daily', 499.90, 4999.00, 'Kurumsal projeler için sınırsız kaynaklı paket', 4, true);
