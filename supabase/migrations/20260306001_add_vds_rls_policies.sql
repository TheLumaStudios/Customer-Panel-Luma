-- Enable RLS on vds table
ALTER TABLE vds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON vds;
DROP POLICY IF EXISTS "Users can view all vds records" ON vds;
DROP POLICY IF EXISTS "Users can insert vds records" ON vds;
DROP POLICY IF EXISTS "Users can update vds records" ON vds;
DROP POLICY IF EXISTS "Users can delete vds records" ON vds;

-- Allow authenticated users to perform all operations on vds table
CREATE POLICY "Allow all operations for authenticated users"
ON vds
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anon users to read (for public access if needed)
CREATE POLICY "Allow read for anon users"
ON vds
FOR SELECT
TO anon
USING (true);
