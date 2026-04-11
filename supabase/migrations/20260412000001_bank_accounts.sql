-- Bank accounts that customers can use to transfer money / see IBAN info.
-- Managed by admins; visible to any authenticated user.

CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name VARCHAR(255) NOT NULL,
  bank_logo_url TEXT,
  account_holder VARCHAR(255) NOT NULL,
  iban VARCHAR(64) NOT NULL,
  swift VARCHAR(32),
  branch VARCHAR(255),
  currency VARCHAR(8) DEFAULT 'TRY',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_active ON bank_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_sort_order ON bank_accounts(sort_order);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can read active accounts (customer panel will show them)
DROP POLICY IF EXISTS "Authenticated can read active bank accounts" ON bank_accounts;
CREATE POLICY "Authenticated can read active bank accounts"
  ON bank_accounts FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can manage all rows
DROP POLICY IF EXISTS "Admins manage bank accounts" ON bank_accounts;
CREATE POLICY "Admins manage bank accounts"
  ON bank_accounts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_bank_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_accounts_updated_at();

COMMENT ON TABLE bank_accounts IS 'Bank accounts shown to customers for manual money transfer.';
