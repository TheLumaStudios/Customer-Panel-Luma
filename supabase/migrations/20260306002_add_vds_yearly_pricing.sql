-- Add yearly pricing and billing cycle to vds table
ALTER TABLE vds
  ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'quarterly', 'one-time')),
  ADD COLUMN IF NOT EXISTS yearly_price DECIMAL(10, 2) DEFAULT 0;

-- Update existing records to have default values
UPDATE vds SET billing_cycle = 'monthly' WHERE billing_cycle IS NULL;
UPDATE vds SET yearly_price = monthly_price * 10 WHERE yearly_price = 0 AND monthly_price > 0; -- 10 month discount for yearly

-- Add comment
COMMENT ON COLUMN vds.billing_cycle IS 'Billing cycle: monthly, yearly, quarterly, or one-time';
COMMENT ON COLUMN vds.yearly_price IS 'Yearly price (if applicable)';
