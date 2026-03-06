-- Allow null values for start_date and expiration_date in hosting table
-- This enables "unlimited" hosting packages

ALTER TABLE hosting
  ALTER COLUMN start_date DROP NOT NULL,
  ALTER COLUMN expiration_date DROP NOT NULL;

COMMENT ON COLUMN hosting.start_date IS 'Hosting start date (NULL = unlimited/no start date)';
COMMENT ON COLUMN hosting.expiration_date IS 'Hosting expiration date (NULL = unlimited/no expiration)';
