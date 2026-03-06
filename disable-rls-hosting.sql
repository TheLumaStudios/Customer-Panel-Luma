-- Disable RLS for hosting tables
ALTER TABLE hosting_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE hosting DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable all for authenticated users" ON hosting_packages;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON hosting;
DROP POLICY IF EXISTS "Enable read access for all users" ON hosting_packages;
DROP POLICY IF EXISTS "Enable read access for all users" ON hosting;

-- Grant full access to authenticated users
GRANT ALL ON hosting_packages TO authenticated;
GRANT ALL ON hosting TO authenticated;
GRANT ALL ON hosting_packages TO anon;
GRANT ALL ON hosting TO anon;
