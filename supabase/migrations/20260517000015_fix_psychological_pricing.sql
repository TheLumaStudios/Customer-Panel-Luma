-- Psikolojik fiyatlandırma düzeltmesi
-- Eski formül: FLOOR(maliyet) + 0.99  →  150 → 150.99 (yanlış)
-- Yeni formül: CEIL(maliyet) - 0.01   →  150 → 149.99 (doğru)

ALTER TABLE product_packages DISABLE TRIGGER meta_catalog_sync_trigger;

UPDATE product_packages
SET
  price_monthly = FLOOR(price_monthly) - 0.01,
  price_original = CASE
    WHEN price_original IS NOT NULL AND price_original > 0
    THEN FLOOR(price_original) - 0.01
    ELSE NULL
  END
WHERE price_monthly > 0;

ALTER TABLE product_packages ENABLE TRIGGER meta_catalog_sync_trigger;
