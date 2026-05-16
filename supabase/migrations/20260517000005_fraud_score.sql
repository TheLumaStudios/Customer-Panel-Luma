-- Fraud Detection: Risk skoru alanları

-- profiles tablosuna fraud_risk_score alanı ekle
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS fraud_risk_score integer DEFAULT 0
    CHECK (fraud_risk_score BETWEEN 0 AND 100);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS fraud_risk_checked_at timestamptz;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS fraud_flags jsonb DEFAULT '[]'::jsonb;

-- customers tablosuna da kaynaklık eden IP'yi sakla (kayıt sırasında)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS registration_ip text;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS registration_country text;

-- İndex: yüksek riskli profilleri hızlı bulmak için
CREATE INDEX IF NOT EXISTS idx_profiles_fraud_risk ON profiles(fraud_risk_score)
  WHERE fraud_risk_score >= 50;

COMMENT ON COLUMN profiles.fraud_risk_score IS
  '0-100 arası fraud risk skoru. 0=güvenli, 50+=şüpheli, 75+=yüksek risk.';
COMMENT ON COLUMN profiles.fraud_flags IS
  'Tetiklenen fraud sinyalleri: [{type, detail, score}]';
