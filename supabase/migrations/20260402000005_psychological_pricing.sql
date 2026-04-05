-- Psikolojik fiyatlandırma: tüm satış fiyatlarını .99 ile bitecek şekilde yuvarla
-- Örn: 129.87 → 129.99, 136.37 → 136.99, 9100.00 → 9099.99

UPDATE product_packages
SET
  price_monthly = FLOOR(price_monthly) + 0.99,
  price_original = CASE
    WHEN price_original IS NOT NULL AND price_original > 0
    THEN FLOOR(price_original) + 0.99
    ELSE NULL
  END
WHERE price_monthly > 0;
