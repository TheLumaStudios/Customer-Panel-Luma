-- Hosting paketlerine farklı dönem fiyatlandırmaları ekle

ALTER TABLE hosting_packages
ADD COLUMN IF NOT EXISTS quarterly_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS semi_annual_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS annual_price DECIMAL(10, 2);

-- Mevcut paketler için varsayılan fiyatları hesapla (indirimli)
-- 3 aylık: aylık fiyat * 3 * 0.95 (5% indirim)
-- 6 aylık: aylık fiyat * 6 * 0.90 (10% indirim)
-- Yıllık: aylık fiyat * 12 * 0.80 (20% indirim)
UPDATE hosting_packages
SET
  quarterly_price = ROUND(monthly_price * 3 * 0.95, 2),
  semi_annual_price = ROUND(monthly_price * 6 * 0.90, 2),
  annual_price = ROUND(monthly_price * 12 * 0.80, 2)
WHERE quarterly_price IS NULL;

COMMENT ON COLUMN hosting_packages.quarterly_price IS '3 aylık dönem fiyatı';
COMMENT ON COLUMN hosting_packages.semi_annual_price IS '6 aylık dönem fiyatı';
COMMENT ON COLUMN hosting_packages.annual_price IS 'Yıllık dönem fiyatı';

-- Hosting tablosuna abonelik referansı ekle
ALTER TABLE hosting
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly'; -- monthly, quarterly, semi_annual, annual

CREATE INDEX IF NOT EXISTS idx_hosting_subscription ON hosting(subscription_id);

COMMENT ON COLUMN hosting.subscription_id IS 'Otomatik abonelik referansı (varsa)';
COMMENT ON COLUMN hosting.billing_cycle IS 'Faturalama dönemi';
