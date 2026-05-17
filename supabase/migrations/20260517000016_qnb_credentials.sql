-- QNB Sanal POS gerçek kimlik bilgileri
-- Üye İşyeri: LUMA YAZILIM
-- Prod URL: https://vpos.qnb.com.tr

UPDATE system_settings SET setting_value = '151700000009548'              WHERE setting_key = 'qnb_merchant_id';
UPDATE system_settings SET setting_value = 'lumayazilimadmin'             WHERE setting_key = 'qnb_user_code';
UPDATE system_settings SET setting_value = 'omyGdln*_@@cXcU2c-BD!IpTl1.Gd5' WHERE setting_key = 'qnb_user_pass';
UPDATE system_settings SET setting_value = 'false'                        WHERE setting_key = 'qnb_test_mode';

-- QNB aktif ve varsayılan yap (iyzico pasif)
UPDATE pos_providers SET is_active = true,  is_default = true  WHERE provider = 'qnb';
UPDATE pos_providers SET is_active = false, is_default = false WHERE provider = 'iyzico';
