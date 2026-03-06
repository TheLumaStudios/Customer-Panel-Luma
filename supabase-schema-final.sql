-- =====================================================
-- Customer Panel Database Schema - FINAL WORKING VERSION
-- =====================================================
-- Run this entire script in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 1: Create helper function FIRST (before tables)
-- =====================================================

-- Create a helper function to check if user is admin
-- SECURITY DEFINER allows this function to bypass RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 2: Create all tables
-- =====================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'customer')) DEFAULT 'customer',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  company_name TEXT,
  tax_id TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  billing_email TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DOMAINS
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL,
  registrar TEXT,
  registration_date DATE,
  expiration_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending_renewal', 'cancelled')),
  renewal_price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HOSTING PACKAGES
CREATE TABLE IF NOT EXISTS hosting_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  package_type TEXT CHECK (package_type IN ('shared', 'vps', 'dedicated', 'cloud')),
  server_location TEXT,
  disk_space TEXT,
  bandwidth TEXT,
  start_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'cancelled')),
  monthly_price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INVOICE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  related_domain_id UUID REFERENCES domains(id),
  related_hosting_id UUID REFERENCES hosting_packages(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TICKET REPLIES
CREATE TABLE IF NOT EXISTS ticket_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('domain_expiry', 'hosting_expiry', 'invoice_due', 'ticket_update', 'payment_received')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_table TEXT,
  is_read BOOLEAN DEFAULT false,
  sent_email BOOLEAN DEFAULT false,
  sent_sms BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICATION PREFERENCES
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email_domain_expiry BOOLEAN DEFAULT true,
  email_hosting_expiry BOOLEAN DEFAULT true,
  email_invoice_due BOOLEAN DEFAULT true,
  email_ticket_update BOOLEAN DEFAULT true,
  sms_domain_expiry BOOLEAN DEFAULT true,
  sms_hosting_expiry BOOLEAN DEFAULT false,
  sms_invoice_due BOOLEAN DEFAULT false,
  expiry_reminder_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ACTIVITY LOG
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SMS LOGS
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed')),
  provider_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 3: Create indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_customers_profile_id ON customers(profile_id);
CREATE INDEX IF NOT EXISTS idx_domains_customer_id ON domains(customer_id);
CREATE INDEX IF NOT EXISTS idx_domains_expiration_date ON domains(expiration_date);
CREATE INDEX IF NOT EXISTS idx_hosting_customer_id ON hosting_packages(customer_id);
CREATE INDEX IF NOT EXISTS idx_hosting_expiration_date ON hosting_packages(expiration_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- =====================================================
-- STEP 4: Enable RLS
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Create RLS Policies
-- =====================================================

-- PROFILES: Simple - users can only see/update their own
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- CUSTOMERS: Customers see own, admins see all
CREATE POLICY "customers_select" ON customers
  FOR SELECT USING (
    profile_id = auth.uid() OR is_admin()
  );

CREATE POLICY "customers_all_admin" ON customers
  FOR ALL USING (is_admin());

-- DOMAINS: Customers see own, admins manage all
CREATE POLICY "domains_select" ON domains
  FOR SELECT USING (
    is_admin() OR
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "domains_all_admin" ON domains
  FOR ALL USING (is_admin());

-- HOSTING: Customers see own, admins manage all
CREATE POLICY "hosting_select" ON hosting_packages
  FOR SELECT USING (
    is_admin() OR
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "hosting_all_admin" ON hosting_packages
  FOR ALL USING (is_admin());

-- INVOICES: Customers see own, admins manage all
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (
    is_admin() OR
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "invoices_all_admin" ON invoices
  FOR ALL USING (is_admin());

-- INVOICE ITEMS: Customers see own invoice items, admins manage all
CREATE POLICY "invoice_items_select" ON invoice_items
  FOR SELECT USING (
    is_admin() OR
    invoice_id IN (
      SELECT id FROM invoices
      WHERE customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "invoice_items_all_admin" ON invoice_items
  FOR ALL USING (is_admin());

-- SUPPORT TICKETS: Customers see/create own, admins manage all
CREATE POLICY "tickets_select" ON support_tickets
  FOR SELECT USING (
    is_admin() OR
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "tickets_insert_customer" ON support_tickets
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "tickets_all_admin" ON support_tickets
  FOR ALL USING (is_admin());

-- TICKET REPLIES: Customers see/reply to own tickets, admins manage all
CREATE POLICY "ticket_replies_select" ON ticket_replies
  FOR SELECT USING (
    is_admin() OR
    ticket_id IN (
      SELECT id FROM support_tickets
      WHERE customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "ticket_replies_insert" ON ticket_replies
  FOR INSERT WITH CHECK (
    is_admin() OR
    ticket_id IN (
      SELECT id FROM support_tickets
      WHERE customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "ticket_replies_all_admin" ON ticket_replies
  FOR ALL USING (is_admin());

-- NOTIFICATIONS: Customers see/update own, admins manage all
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (
    is_admin() OR
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "notifications_update_customer" ON notifications
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "notifications_all_admin" ON notifications
  FOR ALL USING (is_admin());

-- NOTIFICATION PREFERENCES: Customers manage own, admins see all
CREATE POLICY "notif_prefs_select" ON notification_preferences
  FOR SELECT USING (
    is_admin() OR
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "notif_prefs_update" ON notification_preferences
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "notif_prefs_insert" ON notification_preferences
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

-- ACTIVITY LOGS: Admins only
CREATE POLICY "activity_logs_select_admin" ON activity_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "activity_logs_insert_admin" ON activity_logs
  FOR INSERT WITH CHECK (is_admin());

-- SMS LOGS: Admins only
CREATE POLICY "sms_logs_select_admin" ON sms_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "sms_logs_insert_admin" ON sms_logs
  FOR INSERT WITH CHECK (is_admin());

-- =====================================================
-- STEP 6: Create triggers and sequences
-- =====================================================

-- Sequence for customer codes
CREATE SEQUENCE IF NOT EXISTS customer_code_seq START 1;

-- Function to create customer record when profile is created
CREATE OR REPLACE FUNCTION create_customer_for_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'customer' THEN
    INSERT INTO customers (profile_id, customer_code, created_by)
    VALUES (
      NEW.id,
      'CUST-' || LPAD(NEXTVAL('customer_code_seq')::TEXT, 5, '0'),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_customer_trigger ON profiles;
CREATE TRIGGER create_customer_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_customer_for_profile();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_domains_updated_at ON domains;
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hosting_updated_at ON hosting_packages;
CREATE TRIGGER update_hosting_updated_at BEFORE UPDATE ON hosting_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notif_prefs_updated_at ON notification_preferences;
CREATE TRIGGER update_notif_prefs_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sequences for auto-numbering
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

-- =====================================================
-- ALL DONE! You can now use the application
-- =====================================================
