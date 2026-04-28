-- KVKK Consent Tracking Table
-- Stores user acceptance of KVKK, Privacy Policy, and Terms of Service
-- Required for KVKK Article 5 (explicit consent) compliance

CREATE TABLE IF NOT EXISTS kvkk_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL DEFAULT 'registration',
  kvkk_accepted BOOLEAN NOT NULL DEFAULT false,
  privacy_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookups by user
CREATE INDEX idx_kvkk_consents_user_id ON kvkk_consents(user_id);
CREATE INDEX idx_kvkk_consents_consent_type ON kvkk_consents(consent_type);

-- RLS
ALTER TABLE kvkk_consents ENABLE ROW LEVEL SECURITY;

-- Users can view their own consents
CREATE POLICY "Users can view own consents"
  ON kvkk_consents FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own consents
CREATE POLICY "Users can insert own consents"
  ON kvkk_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all consents
CREATE POLICY "Admins can view all consents"
  ON kvkk_consents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'employee')
    )
  );

-- Nobody can delete consents (legal requirement)
-- No UPDATE policy - consents are immutable records

COMMENT ON TABLE kvkk_consents IS 'KVKK uyumlu onay kayıtları - silinemez ve değiştirilemez';
