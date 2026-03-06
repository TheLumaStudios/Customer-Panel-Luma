-- RLS'yi TÜM TABLOLARDAN KALDIR
-- Geliştirme için güvenli, production'da tekrar açarız

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE domains DISABLE ROW LEVEL SECURITY;
ALTER TABLE hosting_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs DISABLE ROW LEVEL SECURITY;

-- Tüm policy'leri kaldır (optional - RLS kapalıyken etkilemez ama temiz olsun)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_new" ON profiles;

DROP POLICY IF EXISTS "customers_select" ON customers;
DROP POLICY IF EXISTS "customers_all_admin" ON customers;
DROP POLICY IF EXISTS "customers_all" ON customers;
DROP POLICY IF EXISTS "Users can view own customer record" ON customers;
DROP POLICY IF EXISTS "Service role can manage customers" ON customers;

DROP POLICY IF EXISTS "domains_select" ON domains;
DROP POLICY IF EXISTS "domains_all_admin" ON domains;
DROP POLICY IF EXISTS "domains_all" ON domains;

DROP POLICY IF EXISTS "hosting_select" ON hosting_packages;
DROP POLICY IF EXISTS "hosting_all_admin" ON hosting_packages;
DROP POLICY IF EXISTS "hosting_all" ON hosting_packages;

DROP POLICY IF EXISTS "invoices_select" ON invoices;
DROP POLICY IF EXISTS "invoices_all_admin" ON invoices;
DROP POLICY IF EXISTS "invoices_all" ON invoices;

DROP POLICY IF EXISTS "invoice_items_select" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_all_admin" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_all" ON invoice_items;

DROP POLICY IF EXISTS "tickets_select" ON support_tickets;
DROP POLICY IF EXISTS "tickets_insert_customer" ON support_tickets;
DROP POLICY IF EXISTS "tickets_all_admin" ON support_tickets;
DROP POLICY IF EXISTS "tickets_all" ON support_tickets;

DROP POLICY IF EXISTS "ticket_replies_select" ON ticket_replies;
DROP POLICY IF EXISTS "ticket_replies_insert" ON ticket_replies;
DROP POLICY IF EXISTS "ticket_replies_all_admin" ON ticket_replies;
DROP POLICY IF EXISTS "ticket_replies_all" ON ticket_replies;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_update_customer" ON notifications;
DROP POLICY IF EXISTS "notifications_all_admin" ON notifications;
DROP POLICY IF EXISTS "notifications_all" ON notifications;

DROP POLICY IF EXISTS "notif_prefs_select" ON notification_preferences;
DROP POLICY IF EXISTS "notif_prefs_update" ON notification_preferences;
DROP POLICY IF EXISTS "notif_prefs_insert" ON notification_preferences;
DROP POLICY IF EXISTS "notif_prefs_all" ON notification_preferences;

DROP POLICY IF EXISTS "activity_logs_select_admin" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert_admin" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_all" ON activity_logs;

DROP POLICY IF EXISTS "sms_logs_select_admin" ON sms_logs;
DROP POLICY IF EXISTS "sms_logs_insert_admin" ON sms_logs;
DROP POLICY IF EXISTS "sms_logs_all" ON sms_logs;

-- Şimdi mevcut kullanıcı için profile oluştur
INSERT INTO profiles (id, email, role, full_name, phone, company_name)
VALUES (
  'c54abd29-1f8b-4dd6-bb6c-21efecc47c60',
  'enespoyraz380@gmail.com',
  'admin',
  'Enes Poyraz',
  '',
  ''
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = EXCLUDED.full_name;

-- Customer kaydı
INSERT INTO customers (profile_id, customer_code, created_by)
VALUES (
  'c54abd29-1f8b-4dd6-bb6c-21efecc47c60',
  'CUST-00001',
  'c54abd29-1f8b-4dd6-bb6c-21efecc47c60'
)
ON CONFLICT (customer_code) DO NOTHING;

-- BAŞARILI MESAJI
SELECT 'RLS DISABLED! Artık tüm işlemler çalışacak.' as message;
