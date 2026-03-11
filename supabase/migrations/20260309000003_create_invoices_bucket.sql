-- Create invoices storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for invoices bucket
-- Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Authenticated users can upload invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Allow public access to download invoices
CREATE POLICY IF NOT EXISTS "Anyone can download invoices"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoices');

-- Allow authenticated users to delete their invoices
CREATE POLICY IF NOT EXISTS "Authenticated users can delete invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoices');
