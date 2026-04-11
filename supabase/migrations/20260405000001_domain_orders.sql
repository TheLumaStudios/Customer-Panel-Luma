-- Milestone 1 (iyzico self-service): extend existing `domain_orders` table so
-- a domain purchase made from the landing cart can be staged BEFORE payment
-- and only executed against the reseller API after iyzico confirms the
-- payment. See payment-iyzico-callback and invoice-create-self.
--
-- The base table was created in 20260307_invoices_and_payments.sql with one
-- row per domain. We reuse that shape and just add the columns we need:
--  - invoice_id          → link to the self-service invoice
--  - register_status     → 'pending' | 'completed' | 'failed' (separate from
--                          the lifecycle `status` column so post-payment
--                          register attempts have their own state machine)
--  - reseller_response   → raw payload from Resellers Panel for debugging
--  - error_message       → human-readable error on failure
--  - contacts            → jsonb alias, populated alongside registrant_contact
--  - NULLable sld/tld/domain/period so we can insert a single row covering
--    a multi-domain order up front (actual per-domain rows are written by
--    the register step).

ALTER TABLE domain_orders
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS register_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reseller_response JSONB,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS contacts JSONB,
  ADD COLUMN IF NOT EXISTS domains JSONB;

-- Allow nullable fields on pre-register rows created by invoice-create-self.
ALTER TABLE domain_orders ALTER COLUMN domain DROP NOT NULL;
ALTER TABLE domain_orders ALTER COLUMN sld DROP NOT NULL;
ALTER TABLE domain_orders ALTER COLUMN tld DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_domain_orders_invoice ON domain_orders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_domain_orders_register_status ON domain_orders(register_status);

COMMENT ON COLUMN domain_orders.invoice_id IS
  'Linked invoice for self-service iyzico domain orders.';
COMMENT ON COLUMN domain_orders.register_status IS
  'Register lifecycle state for post-payment reseller API call: pending | completed | failed.';
