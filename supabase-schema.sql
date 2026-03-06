-- Customer Panel Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'customer')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  company_name TEXT,
  tax_id TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CUSTOMERS (for admin to manage)
CREATE TABLE customers (
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
CREATE TABLE domains (
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
CREATE TABLE hosting_packages (
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
CREATE TABLE invoices (
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
CREATE TABLE invoice_items (
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
CREATE TABLE support_tickets (
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
CREATE TABLE ticket_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS
CREATE TABLE notifications (
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
CREATE TABLE notification_preferences (
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
CREATE TABLE activity_logs (
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
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed')),
  provider_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_customers_profile_id ON customers(profile_id);
CREATE INDEX idx_domains_customer_id ON domains(customer_id);
CREATE INDEX idx_domains_expiration_date ON domains(expiration_date);
CREATE INDEX idx_hosting_customer_id ON hosting_packages(customer_id);
CREATE INDEX idx_hosting_expiration_date ON hosting_packages(expiration_date);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_support_tickets_customer_id ON support_tickets(customer_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_ticket_replies_ticket_id ON ticket_replies(ticket_id);
CREATE INDEX idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
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

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- CUSTOMERS POLICIES
CREATE POLICY "Customers can view own record" ON customers
  FOR SELECT USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage customers" ON customers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DOMAINS POLICIES
CREATE POLICY "View own domains" ON domains
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins manage domains" ON domains
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- HOSTING POLICIES
CREATE POLICY "View own hosting" ON hosting_packages
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins manage hosting" ON hosting_packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INVOICES POLICIES
CREATE POLICY "View own invoices" ON invoices
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins manage invoices" ON invoices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INVOICE ITEMS POLICIES
CREATE POLICY "View invoice items" ON invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE
        customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "Admins manage invoice items" ON invoice_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- SUPPORT TICKETS POLICIES
CREATE POLICY "View own tickets" ON support_tickets
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Customers create tickets" ON support_tickets
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Admins manage tickets" ON support_tickets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- TICKET REPLIES POLICIES
CREATE POLICY "View ticket replies" ON ticket_replies
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE
        customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "Reply to tickets" ON ticket_replies
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE
        customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- NOTIFICATIONS POLICIES
CREATE POLICY "View own notifications" ON notifications
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Update own notifications" ON notifications
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Admins manage notifications" ON notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- NOTIFICATION PREFERENCES POLICIES
CREATE POLICY "View own preferences" ON notification_preferences
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Update own preferences" ON notification_preferences
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Insert own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

-- ACTIVITY LOGS POLICIES (Admins only)
CREATE POLICY "Admins view activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- SMS LOGS POLICIES (Admins only)
CREATE POLICY "Admins view sms logs" ON sms_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins insert sms logs" ON sms_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- DATABASE FUNCTIONS & TRIGGERS
-- =====================================================

-- Sequence for customer codes
CREATE SEQUENCE customer_code_seq START 1;

-- Function to automatically create customer record when profile is created
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

CREATE TRIGGER create_customer_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_customer_for_profile();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hosting_updated_at BEFORE UPDATE ON hosting_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sequence for invoice numbers
CREATE SEQUENCE invoice_number_seq START 1;

-- Sequence for ticket numbers
CREATE SEQUENCE ticket_number_seq START 1;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- You can insert a test admin user after authentication setup
-- This will be done through the application signup flow
