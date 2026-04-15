-- ============================================================================
-- 90 Günlük Kalkınma Planı - Fiyatlandırma + Kampanyalar
-- Hedef: 200+ müşteri
-- ============================================================================

-- ============================================================================
-- 1. ÇOK DÖNEMLİ FİYATLANDIRMA
-- Kural: Uzun dönem = indirim = müşteri kilitleme = nakit akışı
-- Quarterly %5, Semi-annual %10, Annual %20 indirim (maliyetten hep kârdayız)
-- ============================================================================

-- cPanel Hosting (maliyet: 20/30/40/50₺ - fiyatlar KDV hariç)
UPDATE product_packages SET
  price_quarterly = ROUND(price_monthly * 3 * 0.95, 2),
  price_semi_annual = ROUND(price_monthly * 6 * 0.90, 2),
  price_annual = ROUND(price_monthly * 12 * 0.80, 2),
  tax_included = false
WHERE product_type = 'cpanel_hosting' AND is_active = true;

-- Plesk Hosting (aynı maliyet yapısı)
UPDATE product_packages SET
  price_quarterly = ROUND(price_monthly * 3 * 0.95, 2),
  price_semi_annual = ROUND(price_monthly * 6 * 0.90, 2),
  price_annual = ROUND(price_monthly * 12 * 0.80, 2),
  tax_included = false
WHERE product_type = 'plesk_hosting' AND is_active = true;

-- Reseller Hosting
UPDATE product_packages SET
  price_quarterly = ROUND(price_monthly * 3 * 0.95, 2),
  price_semi_annual = ROUND(price_monthly * 6 * 0.90, 2),
  price_annual = ROUND(price_monthly * 12 * 0.80, 2),
  tax_included = false
WHERE product_type = 'reseller_hosting' AND is_active = true;

-- VDS (zaten tax_included=false, sadece multi-period ekle)
UPDATE product_packages SET
  price_quarterly = ROUND(price_monthly * 3 * 0.95, 2),
  price_semi_annual = ROUND(price_monthly * 6 * 0.90, 2),
  price_annual = ROUND(price_monthly * 12 * 0.80, 2)
WHERE product_type = 'vds' AND is_active = true;

-- VPS
UPDATE product_packages SET
  price_quarterly = ROUND(price_monthly * 3 * 0.95, 2),
  price_semi_annual = ROUND(price_monthly * 6 * 0.90, 2),
  price_annual = ROUND(price_monthly * 12 * 0.80, 2)
WHERE product_type = 'vps' AND is_active = true;

-- Dedicated (annual zaten var, quarterly/semi ekle)
UPDATE product_packages SET
  price_quarterly = ROUND(price_monthly * 3 * 0.95, 2),
  price_semi_annual = ROUND(price_monthly * 6 * 0.90, 2)
WHERE product_type = 'dedicated' AND is_active = true AND price_quarterly IS NULL;


-- ============================================================================
-- 2. KAMPANYA PROMO KODLARI (90 günlük plan)
-- Tüm indirimler vergi SONRASI fiyata uygulanır, maliyet kontrolü yapılmıştır
-- ============================================================================

-- Hafta 1-2: Lansman Kampanyası (agresif müşteri çekme)
INSERT INTO promo_codes (code, discount_type, discount_value, min_order_amount, max_uses, max_uses_per_customer, valid_from, valid_until, applicable_types, is_active, is_first_month_free) VALUES
-- Hoşgeldin: İlk alışverişte %15 (tüm ürünlerde - marj hala pozitif)
('HOSGELDIN15', 'percentage', 15, 0, 500, 1, now(), now() + interval '90 days', '{hosting,vds,vps}', true, false),
-- Yıllık alanlara ekstra %10 (zaten %20 yıllık indirim var, toplam %28 - hala kâr)
('YILLIK10', 'percentage', 10, 200, 200, 1, now(), now() + interval '90 days', '{hosting,vds,vps}', true, false),
-- WordPress özel: 50₺ sabit indirim (min 100₺ sipariş)
('WORDPRESS50', 'fixed', 50, 100, 300, 1, now(), now() + interval '60 days', '{hosting}', true, false)
ON CONFLICT (code) DO UPDATE SET
  discount_value = EXCLUDED.discount_value,
  valid_until = EXCLUDED.valid_until,
  is_active = EXCLUDED.is_active;

-- Hafta 3-4: Referans Boost (viral büyüme)
INSERT INTO promo_codes (code, discount_type, discount_value, min_order_amount, max_uses, max_uses_per_customer, valid_from, valid_until, applicable_types, is_active) VALUES
-- Referans ile gelen: İlk ay %25 (tek seferlik, güçlü motivasyon)
('ARKADAS25', 'percentage', 25, 0, 1000, 1, now(), now() + interval '90 days', '{hosting,vds,vps}', true),
-- Sosyal medya paylaşımı: %20 indirim
('SOSYAL20', 'percentage', 20, 0, 500, 1, now(), now() + interval '60 days', '{hosting,vds,vps}', true)
ON CONFLICT (code) DO UPDATE SET
  discount_value = EXCLUDED.discount_value,
  valid_until = EXCLUDED.valid_until,
  is_active = EXCLUDED.is_active;

-- Hafta 5-8: Segment Kampanyaları (hedefli)
INSERT INTO promo_codes (code, discount_type, discount_value, min_order_amount, max_uses, max_uses_per_customer, valid_from, valid_until, applicable_types, is_active) VALUES
-- Yazılımcılara özel VDS: %15 (yüksek LTV segment)
('DEVELOPER15', 'percentage', 15, 100, 200, 1, now(), now() + interval '90 days', '{vds,vps}', true),
-- Ajans/Reseller: İlk ay %30 (yüksek hacim segment)
('AJANS30', 'percentage', 30, 100, 100, 1, now(), now() + interval '90 days', '{reseller_hosting}', true),
-- E-ticaret siteleri: 100₺ indirim (min 200₺)
('ETICARET100', 'fixed', 100, 200, 200, 1, now(), now() + interval '60 days', '{hosting,vds}', true),
-- Öğrenci: %40 indirim (küçük paketlerde - sadece hosting)
('OGRENCI40', 'percentage', 40, 0, 500, 1, now(), now() + interval '90 days', '{hosting}', true)
ON CONFLICT (code) DO UPDATE SET
  discount_value = EXCLUDED.discount_value,
  valid_until = EXCLUDED.valid_until,
  is_active = EXCLUDED.is_active;

-- Hafta 9-12: Retansiyon + Upsell
INSERT INTO promo_codes (code, discount_type, discount_value, min_order_amount, max_uses, max_uses_per_customer, valid_from, valid_until, applicable_types, is_active) VALUES
-- Mevcut müşteri upgrade: %20 (paket yükseltme teşviki)
('UPGRADE20', 'percentage', 20, 50, 500, 2, now(), now() + interval '90 days', '{hosting,vds,vps}', true),
-- Taşınma kampanyası: 75₺ indirim (rakipten gelenlere)
('TASINMA75', 'fixed', 75, 50, 300, 1, now(), now() + interval '90 days', '{hosting}', true),
-- Black Friday benzeri flash sale: %35 (kısa süreli, aciliyet)
('FLASH35', 'percentage', 35, 50, 100, 1, now(), now() + interval '7 days', '{hosting,vds,vps}', true)
ON CONFLICT (code) DO UPDATE SET
  discount_value = EXCLUDED.discount_value,
  valid_until = EXCLUDED.valid_until,
  is_active = EXCLUDED.is_active;

-- Süresiz kampanyalar
INSERT INTO promo_codes (code, discount_type, discount_value, min_order_amount, max_uses, max_uses_per_customer, valid_from, valid_until, applicable_types, is_active) VALUES
-- Bakiye yükleme teşviki: 25₺ indirim (min 500₺ bakiye)
('BAKIYE25', 'fixed', 25, 500, NULL, 3, now(), NULL, '{wallet_topup}', true),
-- Domain + Hosting combo: 30₺ indirim
('COMBO30', 'fixed', 30, 100, NULL, 2, now(), NULL, '{hosting}', true)
ON CONFLICT (code) DO UPDATE SET
  discount_value = EXCLUDED.discount_value,
  is_active = EXCLUDED.is_active;


-- ============================================================================
-- 3. CASHBACK ORANINI GÜNCELLE
-- Hosting marjı %24-26 → %5 cashback çok yüksek (marjın %20'si gidiyor)
-- Çözüm: Cashback'i %3'e düşür ama promosyon bakiyesi olarak ver
-- (Müşteri nakit çekemez, sadece hizmet alabilir = sıfır maliyet riski)
-- ============================================================================
UPDATE system_settings SET setting_value = '3' WHERE setting_key = 'cashback_rate';


-- ============================================================================
-- 4. WALLET BONUS TIER'LARINI GÜNCELLE
-- Mevcut: 10%/30%/50% → Çok agresif, zarar riski
-- Yeni: 5%/10%/15% → Hala çekici ama sürdürülebilir
-- Bonus bakiye = promosyon bakiyesi (sadece hizmet alımında kullanılır)
-- ============================================================================
UPDATE wallet_bonus_tiers SET
  bonus_percentage = 5,
  label = '100₺ yükle, 105₺ kullan'
WHERE min_amount = 100 AND max_amount = 499.99;

UPDATE wallet_bonus_tiers SET
  bonus_percentage = 10,
  label = '500₺ yükle, 550₺ kullan'
WHERE min_amount = 500 AND max_amount = 999.99;

UPDATE wallet_bonus_tiers SET
  bonus_percentage = 15,
  label = '1000₺ yükle, 1150₺ kullan'
WHERE min_amount = 1000 AND max_amount IS NULL;


-- ============================================================================
-- 5. cPanel Paket 1'e "En Popüler" badge ekle (sosyal kanıt)
-- ============================================================================
UPDATE product_packages SET badge_text = 'En Popüler', is_featured = true
WHERE slug = 'cpanel-paket-2';

UPDATE product_packages SET badge_text = 'Başlangıç'
WHERE slug = 'cpanel-paket-1';

UPDATE product_packages SET badge_text = 'Profesyonel'
WHERE slug = 'cpanel-paket-3';

UPDATE product_packages SET badge_text = 'Kurumsal'
WHERE slug = 'cpanel-paket-4';

-- VDS'de en çok satan paketlere badge
UPDATE product_packages SET badge_text = 'En Çok Satan', is_featured = true
WHERE slug = 'vds-l-tr-4gb';

UPDATE product_packages SET badge_text = 'En Çok Satan', is_featured = true
WHERE slug = 'vps-l-tr-4gb';
