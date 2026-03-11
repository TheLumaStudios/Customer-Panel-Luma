-- Müşterilere card_user_key ekle (kayıtlı kartlar için)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS card_user_key VARCHAR(255) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_customers_card_user_key ON customers(card_user_key);

COMMENT ON COLUMN customers.card_user_key IS 'iyzico kayıtlı kart kullanıcı anahtarı';
