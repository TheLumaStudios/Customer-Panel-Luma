-- Add official invoice file URL column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS official_invoice_url TEXT;

-- Create storage bucket for invoices if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for invoices bucket
-- Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Authenticated users can upload invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Allow authenticated users to read their own invoices
CREATE POLICY IF NOT EXISTS "Users can read their own invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoices');

-- Allow admins to read all invoices
CREATE POLICY IF NOT EXISTS "Admins can read all invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to delete invoices
CREATE POLICY IF NOT EXISTS "Admins can delete invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
