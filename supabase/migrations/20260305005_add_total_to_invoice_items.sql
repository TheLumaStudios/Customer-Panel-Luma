-- Add total column to invoice_items table
-- This column stores the calculated total (quantity * unit_price) for each line item

ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS total DECIMAL(10, 2);

-- Set existing totals based on quantity * unit_price
UPDATE invoice_items
SET total = quantity * unit_price
WHERE total IS NULL;

-- Make it NOT NULL after setting values
ALTER TABLE invoice_items
  ALTER COLUMN total SET NOT NULL;

COMMENT ON COLUMN invoice_items.total IS 'Line item total (quantity * unit_price)';
