-- Customer identity card (front/back) images for KYC
-- - Stored as signed URLs inside the private `customer-kyc` bucket.
-- - Customers must upload both before they can use the panel.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS id_card_front_url TEXT,
  ADD COLUMN IF NOT EXISTS id_card_back_url TEXT,
  ADD COLUMN IF NOT EXISTS id_card_uploaded_at TIMESTAMPTZ;

COMMENT ON COLUMN customers.id_card_front_url IS 'Public URL for the front of the customer identity card';
COMMENT ON COLUMN customers.id_card_back_url  IS 'Public URL for the back of the customer identity card';
COMMENT ON COLUMN customers.id_card_uploaded_at IS 'When the customer uploaded both sides of their ID card';

-- Storage bucket for KYC images. Public = false so only signed URLs work.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer-kyc',
  'customer-kyc',
  false,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Customer can upload only into a folder named with their own auth uid
DROP POLICY IF EXISTS "Customer can upload own KYC" ON storage.objects;
CREATE POLICY "Customer can upload own KYC"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'customer-kyc'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Customer can read their own KYC images
DROP POLICY IF EXISTS "Customer can read own KYC" ON storage.objects;
CREATE POLICY "Customer can read own KYC"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'customer-kyc'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Customer can replace their own KYC
DROP POLICY IF EXISTS "Customer can update own KYC" ON storage.objects;
CREATE POLICY "Customer can update own KYC"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'customer-kyc'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins and employees can read all KYC images (verification)
DROP POLICY IF EXISTS "Staff can read all KYC" ON storage.objects;
CREATE POLICY "Staff can read all KYC"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'customer-kyc'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'employee')
  )
);
