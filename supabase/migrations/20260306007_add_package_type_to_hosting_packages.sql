-- Add package_type column to hosting_packages table
-- This allows categorizing hosting packages (basic, standard, premium, enterprise)

ALTER TABLE hosting_packages
  ADD COLUMN IF NOT EXISTS package_type VARCHAR(50) DEFAULT 'standard';

COMMENT ON COLUMN hosting_packages.package_type IS 'Package type category (basic, standard, premium, enterprise)';

-- Update existing packages to have a default type based on their features
UPDATE hosting_packages
SET package_type = CASE
  WHEN disk_space_gb <= 10 OR disk_space_gb IS NULL THEN 'basic'
  WHEN disk_space_gb <= 50 THEN 'standard'
  WHEN disk_space_gb <= 100 THEN 'premium'
  ELSE 'enterprise'
END
WHERE package_type IS NULL OR package_type = 'standard';
