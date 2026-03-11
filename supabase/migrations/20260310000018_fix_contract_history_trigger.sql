-- Fix contract history trigger to use SECURITY DEFINER
-- This allows the trigger to run with the function owner's permissions
-- rather than the user's permissions

-- Recreate the trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION log_contract_approval()
RETURNS TRIGGER
SECURITY DEFINER -- This is the key: use function owner's permissions
SET search_path = public
AS $$
BEGIN
  INSERT INTO contract_history (
    customer_contract_id,
    action,
    old_status,
    new_status,
    details
  ) VALUES (
    NEW.customer_contract_id,
    CASE
      WHEN NEW.approval_status = 'approved' THEN 'approved'
      WHEN NEW.approval_status = 'rejected' THEN 'rejected'
    END,
    NULL,
    NEW.approval_status,
    jsonb_build_object(
      'ip_address', host(NEW.ip_address),
      'user_agent', NEW.user_agent,
      'approved_at', NEW.approved_at
    )
  );

  -- Sözleşme durumunu güncelle
  UPDATE customer_contracts
  SET status = NEW.approval_status,
      updated_at = NOW()
  WHERE id = NEW.customer_contract_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_contract_approval()
IS 'Logs contract approval to history and updates contract status. Uses SECURITY DEFINER to bypass RLS.';
