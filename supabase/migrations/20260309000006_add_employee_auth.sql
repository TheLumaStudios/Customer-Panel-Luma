-- Add profile_id to employees table for auth integration
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_employees_profile_id ON employees(profile_id);

-- Update profiles role enum to include 'employee'
-- First check if the constraint exists and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

-- Add the constraint with employee role
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('admin', 'customer', 'employee'));

-- Comment
COMMENT ON COLUMN employees.profile_id IS 'Link to auth profile for employee login';
