-- Check user role
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as metadata_role,
  raw_user_meta_data
FROM auth.users
WHERE email LIKE '%poyraz%' OR email LIKE '%enes%'
LIMIT 5;
