-- Add columns for tax receipt and official invoice requirement
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS requires_official_invoice BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tax_receipt_url TEXT;

COMMENT ON COLUMN invoices.requires_official_invoice IS 'Whether this invoice requires an official invoice (e-fatura). False for mükerrer 20/B cases.';
COMMENT ON COLUMN invoices.tax_receipt_url IS 'URL to tax payment receipt (vergi dekontu) for invoices that do not require official invoice';
