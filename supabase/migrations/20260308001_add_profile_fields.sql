-- Add profile fields to profiles table
-- This allows users to update their personal information

-- Add columns to profiles table if they don't exist
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comments
COMMENT ON COLUMN profiles.full_name IS 'User full name';
COMMENT ON COLUMN profiles.phone IS 'User phone number';
COMMENT ON COLUMN profiles.company_name IS 'Company name (if business customer)';
COMMENT ON COLUMN profiles.avatar_url IS 'Profile avatar image URL';
