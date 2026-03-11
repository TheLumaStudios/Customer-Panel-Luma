-- Create pending approvals table for financial operations
CREATE TABLE IF NOT EXISTS pending_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Operation Info
  operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN (
    'refund', 'credit_add', 'credit_deduct', 'invoice_cancel',
    'invoice_edit', 'payment_reverse', 'discount_apply'
  )),

  -- Related Records
  related_id UUID, -- Invoice ID, Payment ID, etc.
  related_type VARCHAR(50), -- 'invoice', 'payment', 'credit', etc.

  -- Request Details
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  request_data JSONB, -- Store operation details
  request_reason TEXT,

  -- Approval Details
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,

  -- Customer Info (for context)
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approvals_status ON pending_approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_operation_type ON pending_approvals(operation_type);
CREATE INDEX IF NOT EXISTS idx_approvals_requested_by ON pending_approvals(requested_by);
CREATE INDEX IF NOT EXISTS idx_approvals_customer_id ON pending_approvals(customer_id);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON pending_approvals(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS approvals_updated_at_trigger ON pending_approvals;
CREATE TRIGGER approvals_updated_at_trigger
  BEFORE UPDATE ON pending_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_approvals_updated_at();

-- RLS Policies
ALTER TABLE pending_approvals ENABLE ROW LEVEL SECURITY;

-- Admins can see and manage all approvals
CREATE POLICY "Admins can manage all approvals"
  ON pending_approvals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Employees can see their own requests
CREATE POLICY "Employees can see their own approval requests"
  ON pending_approvals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
      AND profiles.id = pending_approvals.requested_by
    )
  );

-- Employees can create approval requests
CREATE POLICY "Employees can create approval requests"
  ON pending_approvals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Comments
COMMENT ON TABLE pending_approvals IS 'Approval workflow for financial operations';
COMMENT ON COLUMN pending_approvals.operation_type IS 'Type of operation requiring approval';
COMMENT ON COLUMN pending_approvals.request_data IS 'JSON data containing operation details';
COMMENT ON COLUMN pending_approvals.status IS 'Approval status: pending, approved, or rejected';
