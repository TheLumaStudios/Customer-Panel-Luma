-- invoices bucket'ını oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Authenticated users can upload invoices" ON storage.objects;
CREATE POLICY "Authenticated users can upload invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

DROP POLICY IF EXISTS "Authenticated users can read invoices" ON storage.objects;
CREATE POLICY "Authenticated users can read invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoices');

DROP POLICY IF EXISTS "Public can read invoices" ON storage.objects;
CREATE POLICY "Public can read invoices"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoices');

DROP POLICY IF EXISTS "Admins and employees can delete invoices" ON storage.objects;
CREATE POLICY "Admins and employees can delete invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'employee')
  )
);

DROP POLICY IF EXISTS "Admins and employees can update invoices" ON storage.objects;
CREATE POLICY "Admins and employees can update invoices"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'employee')
  )
);
