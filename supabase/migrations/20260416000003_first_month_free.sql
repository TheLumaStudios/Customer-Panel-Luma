-- "İlk Ay Bedava" Kampanyası
-- Seed promo code: ILKAY, 100% discount, is_first_month_free=true

INSERT INTO promo_codes (code, discount_type, discount_value, is_first_month_free, is_active, applicable_types)
VALUES ('ILKAY', 'percentage', 100, true, true, '{hosting,vds}')
ON CONFLICT (code) DO UPDATE SET
  discount_type = 'percentage',
  discount_value = 100,
  is_first_month_free = true,
  is_active = true;
