-- Add tax exemption tracking for invoices
-- This supports 20/B (mükerrer) invoice type tracking

-- Add columns to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(50) DEFAULT 'official' CHECK (invoice_type IN ('official', 'mukerrer_20b'));

-- Add annual limit tracking to customers
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS annual_mukerrer_limit DECIMAL(10, 2) DEFAULT 880000.00,
ADD COLUMN IF NOT EXISTS mukerrer_year_total DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS mukerrer_last_reset_year INTEGER;

-- Create function to calculate annual 20/B total
CREATE OR REPLACE FUNCTION calculate_mukerrer_annual_total(p_customer_id UUID, p_year INTEGER)
RETURNS DECIMAL AS $$
DECLARE
  v_total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(total), 0) INTO v_total
  FROM invoices
  WHERE customer_id = p_customer_id
    AND invoice_type = 'mukerrer_20b'
    AND status = 'paid'
    AND EXTRACT(YEAR FROM created_at) = p_year;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if limit exceeded
CREATE OR REPLACE FUNCTION check_mukerrer_limit(p_customer_id UUID, p_amount DECIMAL)
RETURNS JSON AS $$
DECLARE
  v_customer RECORD;
  v_current_total DECIMAL;
  v_current_year INTEGER;
  v_new_total DECIMAL;
BEGIN
  v_current_year := EXTRACT(YEAR FROM NOW());

  -- Get customer data
  SELECT annual_mukerrer_limit, mukerrer_year_total, mukerrer_last_reset_year
  INTO v_customer
  FROM customers
  WHERE id = p_customer_id;

  -- Reset if new year
  IF v_customer.mukerrer_last_reset_year IS NULL OR v_customer.mukerrer_last_reset_year < v_current_year THEN
    v_current_total := calculate_mukerrer_annual_total(p_customer_id, v_current_year);

    UPDATE customers
    SET mukerrer_year_total = v_current_total,
        mukerrer_last_reset_year = v_current_year
    WHERE id = p_customer_id;
  ELSE
    v_current_total := v_customer.mukerrer_year_total;
  END IF;

  v_new_total := v_current_total + p_amount;

  RETURN json_build_object(
    'within_limit', v_new_total <= v_customer.annual_mukerrer_limit,
    'current_total', v_current_total,
    'new_total', v_new_total,
    'limit', v_customer.annual_mukerrer_limit,
    'remaining', v_customer.annual_mukerrer_limit - v_new_total,
    'limit_exceeded', v_new_total > v_customer.annual_mukerrer_limit
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_mukerrer_annual_total TO authenticated;
GRANT EXECUTE ON FUNCTION check_mukerrer_limit TO authenticated;

-- Comments
COMMENT ON COLUMN invoices.invoice_type IS 'Invoice type: official (resmi fatura) or mukerrer_20b (sosyal içerik hesabı)';
COMMENT ON COLUMN customers.annual_mukerrer_limit IS 'Annual limit for tax-exempt 20/B invoices (default 880,000 TL)';
COMMENT ON COLUMN customers.mukerrer_year_total IS 'Total 20/B invoices paid this year';
COMMENT ON COLUMN customers.mukerrer_last_reset_year IS 'Last year when mukerrer total was reset';
COMMENT ON FUNCTION check_mukerrer_limit IS 'Check if adding amount would exceed annual 20/B limit';
