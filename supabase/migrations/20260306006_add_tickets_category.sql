-- Add category column to support_tickets table
-- This allows categorizing tickets (technical, billing, hosting, vds, domain, etc.)

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS category VARCHAR(50);

COMMENT ON COLUMN support_tickets.category IS 'Ticket category (technical, billing, sales, general, hosting, vds, domain)';

-- Update existing tickets to have a default category
UPDATE support_tickets
SET category = 'general'
WHERE category IS NULL;
