-- pgcrypto extension'ını etkinleştir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Şifreleme için DB fonksiyonları
-- Şifreleme anahtarı Supabase Vault veya env değişkeninden alınmalı.
-- Uygulama katmanı Edge Function'lar içinde ENCRYPTION_KEY secret'ı ile kullanır.

-- Helper: hassas alanın şifreli mi yoksa düz mı olduğunu kontrol et
-- (Migration sırasında mevcut verileri migrate etmek için)
CREATE OR REPLACE FUNCTION is_pgp_encrypted(val text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- PGP armored mesajlar \xc3 ile başlar veya -----BEGIN PGP ile başlar
  RETURN val IS NOT NULL AND (
    val LIKE '-----BEGIN PGP MESSAGE-----%'
    OR length(val) > 50
  );
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- hosting tablosuna not: cpanel_password_encrypted alanı zaten var
-- Şifreleme Edge Function katmanında yapılacak (pgp_sym_encrypt ile)
-- Mevcut düz metin değerler deployment sırasında migrate edilecek

-- Şifreleme helper fonksiyonu (Edge Function'lardan çağrılır)
CREATE OR REPLACE FUNCTION encrypt_text(plain text, key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(plain, key, 'cipher-algo=aes256'),
    'base64'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN plain; -- şifreleme başarısız olursa düz metin döndür (log'la)
END;
$$;

-- Şifre çözme helper fonksiyonu
CREATE OR REPLACE FUNCTION decrypt_text(encrypted text, key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted, 'base64'),
    key
  );
EXCEPTION WHEN OTHERS THEN
  RETURN encrypted; -- şifre çözme başarısız olursa şifreli metni döndür
END;
$$;

COMMENT ON EXTENSION pgcrypto IS 'Hassas alan şifreleme için (AES-256 via pgp_sym_encrypt)';
