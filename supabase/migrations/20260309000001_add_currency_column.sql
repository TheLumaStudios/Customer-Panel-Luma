-- Add currency column if not exists
DO $$
BEGIN
  -- Add currency to invoices if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'currency'
  ) THEN
    ALTER TABLE invoices ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'TRY';
  END IF;

  -- Add currency to payments if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'currency'
  ) THEN
    ALTER TABLE payments ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'TRY';
  END IF;

  -- Add currency to recurring_billing if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_billing' AND column_name = 'currency'
  ) THEN
    ALTER TABLE recurring_billing ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'TRY';
  END IF;

  -- Add currency to customer_credit if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_credit' AND column_name = 'currency'
  ) THEN
    ALTER TABLE customer_credit ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'TRY';
  END IF;

  -- Add currency to credit_transactions if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credit_transactions' AND column_name = 'currency'
  ) THEN
    ALTER TABLE credit_transactions ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'TRY';
  END IF;

  -- Add currency to domain_orders if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domain_orders' AND column_name = 'currency'
  ) THEN
    ALTER TABLE domain_orders ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'TRY';
  END IF;
END $$;
