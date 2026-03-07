-- Invoice Management System
-- This migration creates tables for invoice, payments, and recurring billing

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,

  -- Invoice details
  status VARCHAR(20) NOT NULL DEFAULT 'unpaid', -- unpaid, paid, cancelled, refunded, overdue
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_date TIMESTAMP WITH TIME ZONE,

  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Payment info
  payment_method VARCHAR(50), -- credit_card, bank_transfer, wallet, iyzico, paytr
  transaction_id VARCHAR(100),

  -- Notes
  notes TEXT,
  admin_notes TEXT,

  -- Automation
  reminder_sent_count INTEGER DEFAULT 0,
  last_reminder_sent TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice items table (line items)
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  -- Item details
  type VARCHAR(50) NOT NULL, -- hosting, domain, vds, addon, setup_fee
  description TEXT NOT NULL,

  -- Related service (optional)
  service_id UUID, -- references to hosting_accounts, domains, etc
  service_type VARCHAR(50), -- 'hosting', 'domain', 'vds'

  -- Pricing
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table (payment transactions)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  payment_method VARCHAR(50) NOT NULL, -- iyzico, paytr, bank_transfer, wallet

  -- Gateway info
  gateway_transaction_id VARCHAR(100),
  gateway_response TEXT,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded

  -- Metadata
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring billing table (subscriptions)
CREATE TABLE IF NOT EXISTS recurring_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Service reference
  service_id UUID NOT NULL,
  service_type VARCHAR(50) NOT NULL, -- 'hosting', 'domain', 'vds'

  -- Billing cycle
  billing_cycle VARCHAR(20) NOT NULL, -- monthly, quarterly, semi_annually, annually, biennially
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Dates
  next_due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  last_invoice_date TIMESTAMP WITH TIME ZONE,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, suspended, cancelled

  -- Automation
  auto_renew BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hosting accounts table (for cPanel integration)
CREATE TABLE IF NOT EXISTS hosting_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Account details
  domain VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  package_id UUID REFERENCES hosting_packages(id),

  -- Server
  server_id UUID, -- references to servers table (will be created)

  -- cPanel info
  cpanel_username VARCHAR(50),
  cpanel_password_encrypted TEXT,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, suspended, terminated
  suspension_reason TEXT,

  -- Dates
  activated_at TIMESTAMP WITH TIME ZONE,
  suspended_at TIMESTAMP WITH TIME ZONE,
  terminated_at TIMESTAMP WITH TIME ZONE,
  next_due_date TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Servers table (cPanel/Plesk servers)
CREATE TABLE IF NOT EXISTS servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Server details
  name VARCHAR(100) NOT NULL,
  hostname VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,

  -- Type
  type VARCHAR(20) NOT NULL, -- cpanel, plesk, directadmin

  -- API credentials
  api_token_encrypted TEXT,
  api_username VARCHAR(100),
  api_port INTEGER DEFAULT 2087,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive, maintenance

  -- Limits
  max_accounts INTEGER DEFAULT 0,
  active_accounts INTEGER DEFAULT 0,

  -- Metadata
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Domain orders table (for tracking domain registrations)
CREATE TABLE IF NOT EXISTS domain_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Domain details
  domain VARCHAR(255) NOT NULL,
  sld VARCHAR(100) NOT NULL,
  tld VARCHAR(50) NOT NULL,

  -- Registration info
  period INTEGER NOT NULL DEFAULT 1,
  registration_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,

  -- Contacts
  registrant_contact JSONB,

  -- Nameservers
  nameservers TEXT[],

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, transferred, expired, cancelled

  -- Auto-renew
  auto_renew BOOLEAN DEFAULT true,

  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- External reference (from registrar)
  registrar_order_id VARCHAR(100),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer credit/wallet table
CREATE TABLE IF NOT EXISTS customer_credit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Transaction details
  type VARCHAR(20) NOT NULL, -- credit, debit, refund
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Reference
  invoice_id UUID REFERENCES invoices(id),
  payment_id UUID REFERENCES payments(id),

  -- Description
  description TEXT,

  -- Balance after transaction
  balance_after DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_recurring_customer ON recurring_billing(customer_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next_due ON recurring_billing(next_due_date);
CREATE INDEX IF NOT EXISTS idx_hosting_customer ON hosting_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_hosting_status ON hosting_accounts(status);
CREATE INDEX IF NOT EXISTS idx_domain_orders_customer ON domain_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_domain_orders_expiry ON domain_orders(expiry_date);

-- RLS Policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_credit ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for customers (can view their own data)
DROP POLICY IF EXISTS "Customers can view their own invoices" ON invoices;
CREATE POLICY "Customers can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can view their own payments" ON payments;
CREATE POLICY "Customers can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can view their own hosting accounts" ON hosting_accounts;
CREATE POLICY "Customers can view their own hosting accounts"
  ON hosting_accounts FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can view their own domain orders" ON domain_orders;
CREATE POLICY "Customers can view their own domain orders"
  ON domain_orders FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can view their own credit" ON customer_credit;
CREATE POLICY "Customers can view their own credit"
  ON customer_credit FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can view their own credit transactions" ON credit_transactions;
CREATE POLICY "Customers can view their own credit transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can view invoice items" ON invoice_items;
CREATE POLICY "Customers can view invoice items"
  ON invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Customers can view recurring billing" ON recurring_billing;
CREATE POLICY "Customers can view recurring billing"
  ON recurring_billing FOR SELECT
  USING (auth.uid() = customer_id);

-- Policies for admins (can do everything)
DROP POLICY IF EXISTS "Admins can do everything on invoices" ON invoices;
CREATE POLICY "Admins can do everything on invoices"
  ON invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can do everything on payments" ON payments;
CREATE POLICY "Admins can do everything on payments"
  ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can do everything on hosting accounts" ON hosting_accounts;
CREATE POLICY "Admins can do everything on hosting accounts"
  ON hosting_accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can do everything on servers" ON servers;
CREATE POLICY "Admins can do everything on servers"
  ON servers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can do everything on domain orders" ON domain_orders;
CREATE POLICY "Admins can do everything on domain orders"
  ON domain_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can do everything on invoice items" ON invoice_items;
CREATE POLICY "Admins can do everything on invoice items"
  ON invoice_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can do everything on recurring billing" ON recurring_billing;
CREATE POLICY "Admins can do everything on recurring billing"
  ON recurring_billing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can do everything on customer credit" ON customer_credit;
CREATE POLICY "Admins can do everything on customer credit"
  ON customer_credit FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can do everything on credit transactions" ON credit_transactions;
CREATE POLICY "Admins can do everything on credit transactions"
  ON credit_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Functions for automatic invoice number generation
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  next_number INTEGER;
  invoice_num VARCHAR(50);
BEGIN
  -- Get the next number (count + 1)
  SELECT COUNT(*) + 1 INTO next_number FROM invoices;

  -- Format: INV-YYYYMM-0001
  invoice_num := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(next_number::TEXT, 4, '0');

  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice number
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_invoice_number ON invoices;
CREATE TRIGGER trigger_set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_billing_updated_at ON recurring_billing;
CREATE TRIGGER update_recurring_billing_updated_at
  BEFORE UPDATE ON recurring_billing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hosting_accounts_updated_at ON hosting_accounts;
CREATE TRIGGER update_hosting_accounts_updated_at
  BEFORE UPDATE ON hosting_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_servers_updated_at ON servers;
CREATE TRIGGER update_servers_updated_at
  BEFORE UPDATE ON servers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_domain_orders_updated_at ON domain_orders;
CREATE TRIGGER update_domain_orders_updated_at
  BEFORE UPDATE ON domain_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_credit_updated_at ON customer_credit;
CREATE TRIGGER update_customer_credit_updated_at
  BEFORE UPDATE ON customer_credit
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
