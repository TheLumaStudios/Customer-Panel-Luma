-- Public storage bucket for bank logos.
-- Admins upload; everyone can read (logos are shown on customer wallet page).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bank-logos',
  'bank-logos',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can read bank logos" ON storage.objects;
CREATE POLICY "Public can read bank logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'bank-logos');

DROP POLICY IF EXISTS "Admins can upload bank logos" ON storage.objects;
CREATE POLICY "Admins can upload bank logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bank-logos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update bank logos" ON storage.objects;
CREATE POLICY "Admins can update bank logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bank-logos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete bank logos" ON storage.objects;
CREATE POLICY "Admins can delete bank logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bank-logos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
