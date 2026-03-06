-- Create settings table for company and system settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company Info
  company_name VARCHAR(255) DEFAULT 'SIRKET ADIN',
  company_slogan VARCHAR(255) DEFAULT 'Musteri ve Hizmet Yonetim Sistemleri',
  company_website VARCHAR(255) DEFAULT 'www.sirketiniz.com',
  company_email VARCHAR(255) DEFAULT 'info@sirketiniz.com',
  company_phone VARCHAR(50) DEFAULT '+90 (212) 123 45 67',
  company_address TEXT,
  company_tax_office VARCHAR(255),
  company_tax_number VARCHAR(20),

  -- Bank Info
  bank_name VARCHAR(255) DEFAULT 'Ziraat Bankasi',
  bank_iban VARCHAR(50) DEFAULT 'TR00 0000 0000 0000 0000 0000 00',
  bank_account_name VARCHAR(255) DEFAULT 'SIRKET ADIN',
  bank_swift VARCHAR(20),
  bank_branch VARCHAR(255),

  -- Support Info
  support_email VARCHAR(255) DEFAULT 'destek@sirketiniz.com',
  support_phone VARCHAR(50) DEFAULT '+90 (212) 123 45 67',

  -- Invoice Settings
  invoice_footer_text TEXT DEFAULT 'Bu belge elektronik ortamda olusturulmus olup, dijital imza ile gecerlidir.',
  invoice_legal_text TEXT DEFAULT 'Isbu sozlesme elektronik ortamda taraflarin karsilikli irade beyani ile akdedilmistir. Sistem tarafindan atanan benzersiz islem numarasi ve zaman damgasi kayitlari kesin delil niteligindedir.',
  invoice_notes TEXT,

  -- Tax Settings
  default_tax_rate DECIMAL(5, 2) DEFAULT 0.00,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS settings_updated_at_trigger ON settings;
CREATE TRIGGER settings_updated_at_trigger
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

COMMENT ON TABLE settings IS 'System and company settings';
