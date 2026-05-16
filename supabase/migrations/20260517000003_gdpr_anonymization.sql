-- KVKK/GDPR: Kişisel veri anonimleştirme desteği

-- profiles tablosuna anonymized_at alanı ekle
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS anonymized_at timestamptz;

-- customers tablosuna anonimleştirme alanı ekle
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS anonymized_at timestamptz;

-- Anonimleştirme işlemi için audit log girişi
-- (audit_logs tablosu zaten mevcut)

-- İndex: anonimleştirilmiş kayıtları hızlı bulmak için
CREATE INDEX IF NOT EXISTS idx_profiles_anonymized ON profiles(anonymized_at)
  WHERE anonymized_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_anonymized ON customers(anonymized_at)
  WHERE anonymized_at IS NOT NULL;

COMMENT ON COLUMN profiles.anonymized_at IS
  'KVKK/GDPR beni-unut talebi işleme tarihi. NULL = aktif, NOT NULL = anonimleştirildi.';
COMMENT ON COLUMN customers.anonymized_at IS
  'KVKK/GDPR beni-unut talebi işleme tarihi. Fatura kayıtları yasal zorunluluk nedeniyle 10 yıl saklanır.';
