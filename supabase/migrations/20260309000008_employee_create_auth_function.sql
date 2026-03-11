-- Function to create employee auth account
-- This is a workaround for edge function JWT issues
-- Called via RPC from frontend

CREATE OR REPLACE FUNCTION create_employee_auth(
  p_employee_id UUID,
  p_email TEXT,
  p_full_name TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_password TEXT;
  v_user_id UUID;
  v_admin_role TEXT;
BEGIN
  -- Check if caller is admin
  SELECT role INTO v_admin_role
  FROM profiles
  WHERE id = auth.uid();

  IF v_admin_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only admins can create employee accounts'
    );
  END IF;

  -- Check if employee exists and doesn't have auth yet
  IF EXISTS (
    SELECT 1 FROM employees
    WHERE id = p_employee_id AND profile_id IS NOT NULL
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Employee already has a login account'
    );
  END IF;

  -- Generate random password
  v_password := encode(gen_random_bytes(8), 'base64') || '123!';

  -- Create auth user using auth.users (requires SECURITY DEFINER)
  -- Note: This is a simplified version, actual user creation needs to be done via edge function
  -- For now, we'll return an error and suggest using the API directly

  RETURN json_build_object(
    'success', false,
    'error', 'Auth user creation must be done via Edge Function or Admin API',
    'note', 'SQL functions cannot create auth users directly'
  );

END;
$$;

-- Grant execute to authenticated users (admin check is inside function)
GRANT EXECUTE ON FUNCTION create_employee_auth TO authenticated;

COMMENT ON FUNCTION create_employee_auth IS 'Creates authentication account for employee - admin only';
