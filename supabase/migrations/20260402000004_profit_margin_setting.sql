-- Kâr marjı sistem ayarı
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
  ('profit_margin_percent', '30', 'number', 'pricing', 'Ürün paketlerine uygulanacak varsayılan kâr marjı yüzdesi')
ON CONFLICT (setting_key) DO NOTHING;

-- Mevcut fiyatları düzelt: verilen fiyatlar maliyettir, satış fiyatı = maliyet * 1.30
-- Önce cost_monthly'yi mevcut price_monthly ile doldur (bunlar maliyetti)
UPDATE product_packages
SET cost_monthly = price_monthly
WHERE cost_monthly = 0 OR cost_monthly IS NULL;

-- Sonra price_monthly'yi %30 kâr ile güncelle
-- price_original'ı da oranla güncelle
UPDATE product_packages
SET
  price_monthly = ROUND(cost_monthly * 1.30, 2),
  price_original = CASE
    WHEN price_original IS NOT NULL AND price_original > 0
    THEN ROUND(price_original * 1.30, 2)
    ELSE NULL
  END
WHERE cost_monthly > 0;
