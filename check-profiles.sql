-- Check all profiles
SELECT id, full_name, email, role
FROM profiles
ORDER BY created_at DESC
LIMIT 20;

-- Check customers and their profile_id references
SELECT
  c.id as customer_id,
  c.customer_code,
  c.full_name as customer_name,
  c.profile_id,
  p.full_name as profile_name,
  p.email as profile_email
FROM customers c
LEFT JOIN profiles p ON c.profile_id = p.id
ORDER BY c.created_at DESC
LIMIT 20;

-- Check if there are any orphaned profile_id references
SELECT
  c.id,
  c.customer_code,
  c.profile_id
FROM customers c
WHERE c.profile_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = c.profile_id
  );
