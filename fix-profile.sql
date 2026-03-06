-- Check if profile exists
SELECT * FROM profiles WHERE id = 'c54abd29-1f8b-4dd6-bb6c-21efecc47c60';

-- Delete if exists (to recreate)
DELETE FROM profiles WHERE id = 'c54abd29-1f8b-4dd6-bb6c-21efecc47c60';

-- Create profile
INSERT INTO profiles (id, email, role, full_name)
VALUES (
  'c54abd29-1f8b-4dd6-bb6c-21efecc47c60',
  'enespoyraz380@gmail.com',
  'admin',
  'Enes Poyraz'
)
ON CONFLICT (id) DO UPDATE
SET
  role = 'admin',
  full_name = 'Enes Poyraz',
  email = 'enespoyraz380@gmail.com';

-- Verify profile was created
SELECT * FROM profiles WHERE id = 'c54abd29-1f8b-4dd6-bb6c-21efecc47c60';

-- Also check customer record
SELECT * FROM customers WHERE user_id = 'c54abd29-1f8b-4dd6-bb6c-21efecc47c60';
