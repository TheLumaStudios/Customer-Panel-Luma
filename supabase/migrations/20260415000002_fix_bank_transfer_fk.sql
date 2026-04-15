-- bank_transfer_confirmations FK'sini CASCADE olarak güncelle
ALTER TABLE bank_transfer_confirmations
  DROP CONSTRAINT IF EXISTS bank_transfer_confirmations_invoice_id_fkey;

ALTER TABLE bank_transfer_confirmations
  ADD CONSTRAINT bank_transfer_confirmations_invoice_id_fkey
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
