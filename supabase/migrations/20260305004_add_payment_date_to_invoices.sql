-- Add payment_date column to invoices table
-- This allows tracking when a paid invoice was actually paid

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS payment_date DATE;

COMMENT ON COLUMN invoices.payment_date IS 'Date when the invoice was paid (for paid invoices)';
