-- Create employees table for staff management
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal Info
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),

  -- Employment Info
  employee_code VARCHAR(50) UNIQUE,
  position VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  hire_date DATE,
  termination_date DATE,

  -- Compensation
  salary DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'TRY',

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_employee_code ON employees(employee_code);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS employees_updated_at_trigger ON employees;
CREATE TRIGGER employees_updated_at_trigger
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_employees_updated_at();

-- RLS Policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage employees"
  ON employees
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE employees IS 'Employee/staff management';
COMMENT ON COLUMN employees.employee_code IS 'Unique employee identifier code';
COMMENT ON COLUMN employees.position IS 'Job title/position';
COMMENT ON COLUMN employees.department IS 'Department name';
COMMENT ON COLUMN employees.salary IS 'Monthly salary amount';
COMMENT ON COLUMN employees.status IS 'Employment status: active, inactive, or terminated';
