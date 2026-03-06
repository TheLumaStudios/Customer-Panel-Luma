-- Add credential fields to hosting table
-- This allows storing cPanel, FTP and other access credentials

ALTER TABLE hosting
  ADD COLUMN IF NOT EXISTS cpanel_username VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cpanel_password TEXT,
  ADD COLUMN IF NOT EXISTS ftp_username VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ftp_password TEXT,
  ADD COLUMN IF NOT EXISTS server_ip VARCHAR(50),
  ADD COLUMN IF NOT EXISTS nameserver_1 VARCHAR(255) DEFAULT 'ns1.example.com',
  ADD COLUMN IF NOT EXISTS nameserver_2 VARCHAR(255) DEFAULT 'ns2.example.com';

COMMENT ON COLUMN hosting.cpanel_username IS 'cPanel login username';
COMMENT ON COLUMN hosting.cpanel_password IS 'cPanel login password';
COMMENT ON COLUMN hosting.ftp_username IS 'FTP login username';
COMMENT ON COLUMN hosting.ftp_password IS 'FTP login password';
COMMENT ON COLUMN hosting.server_ip IS 'Server IP address';
COMMENT ON COLUMN hosting.nameserver_1 IS 'Primary nameserver';
COMMENT ON COLUMN hosting.nameserver_2 IS 'Secondary nameserver';

-- Update RLS policies to ensure customers can only see their own hosting credentials
DROP POLICY IF EXISTS "Customers can view their own hosting" ON hosting;
CREATE POLICY "Customers can view their own hosting"
  ON hosting FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE email = auth.jwt()->>'email'
    )
  );
