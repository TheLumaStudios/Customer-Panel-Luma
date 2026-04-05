-- Migration: WHMCS Automation Tables
-- Description: Add cron jobs, email templates, provisioning queue, bank transfers,
--              ticket departments, knowledge base, announcements, server status,
--              DNS records, domain transfers, and related columns/settings.

-- ============================================================================
-- 1. cron_jobs
-- ============================================================================
CREATE TABLE IF NOT EXISTS cron_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name text NOT NULL UNIQUE,
  description text,
  schedule text NOT NULL,
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2. cron_job_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS cron_job_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES cron_jobs(id) ON DELETE CASCADE,
  job_name text NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  items_processed integer DEFAULT 0,
  error_message text,
  details jsonb
);

-- ============================================================================
-- 3. email_templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key text NOT NULL UNIQUE,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  variables text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. email_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key text,
  recipient_email text NOT NULL,
  subject text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 5. provisioning_queue
-- ============================================================================
CREATE TABLE IF NOT EXISTS provisioning_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid REFERENCES invoices(id),
  customer_id uuid NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('hosting', 'domain', 'vds')),
  service_config jsonb NOT NULL DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  error_message text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 6. bank_transfer_confirmations
-- ============================================================================
CREATE TABLE IF NOT EXISTS bank_transfer_confirmations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid REFERENCES invoices(id),
  customer_id uuid NOT NULL,
  bank_name text NOT NULL,
  sender_name text NOT NULL,
  transfer_date date,
  amount numeric(12,2) NOT NULL,
  receipt_url text,
  reference_number text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 7. ticket_departments
-- ============================================================================
CREATE TABLE IF NOT EXISTS ticket_departments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  email text,
  auto_assign_to uuid,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 8. kb_categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS kb_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  parent_id uuid REFERENCES kb_categories(id) ON DELETE SET NULL,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 9. kb_articles
-- ============================================================================
CREATE TABLE IF NOT EXISTS kb_articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES kb_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  tags text[] DEFAULT '{}',
  views integer DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 10. announcements
-- ============================================================================
CREATE TABLE IF NOT EXISTS announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'critical', 'maintenance')),
  is_active boolean DEFAULT true,
  show_on_login boolean DEFAULT false,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 11. server_status
-- ============================================================================
CREATE TABLE IF NOT EXISTS server_status (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id uuid REFERENCES servers(id) ON DELETE CASCADE,
  server_name text NOT NULL,
  status text DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance')),
  message text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 12. dns_records
-- ============================================================================
CREATE TABLE IF NOT EXISTS dns_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id uuid REFERENCES domains(id) ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type IN ('A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA')),
  name text NOT NULL,
  value text NOT NULL,
  ttl integer DEFAULT 3600,
  priority integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 13. domain_transfers
-- ============================================================================
CREATE TABLE IF NOT EXISTS domain_transfers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL,
  domain_name text NOT NULL,
  auth_code text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  registrar_transfer_id text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 14. Add columns to existing tables
-- ============================================================================

-- hosting table additions
ALTER TABLE hosting ADD COLUMN IF NOT EXISTS next_invoice_date date;
ALTER TABLE hosting ADD COLUMN IF NOT EXISTS invoice_days_before integer DEFAULT 14;
ALTER TABLE hosting ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

-- domains table additions
ALTER TABLE domains ADD COLUMN IF NOT EXISTS next_invoice_date date;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS invoice_days_before integer DEFAULT 14;

-- invoices table additions
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS related_service_id uuid;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS related_service_type text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS late_fee numeric(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS original_total numeric(12,2);

-- support_tickets table addition
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES ticket_departments(id);

-- ============================================================================
-- 15. Insert default system_settings
-- ============================================================================
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
  ('auto_invoice_enabled', 'true', 'boolean'),
  ('invoice_days_before_renewal', '14', 'number'),
  ('auto_suspend_enabled', 'true', 'boolean'),
  ('auto_suspend_days_overdue', '7', 'number'),
  ('auto_terminate_days_suspended', '30', 'number'),
  ('late_fee_enabled', 'false', 'boolean'),
  ('late_fee_type', 'percentage', 'string'),
  ('late_fee_amount', '5', 'number'),
  ('late_fee_grace_days', '3', 'number'),
  ('smtp_host', '', 'string'),
  ('smtp_port', '587', 'number'),
  ('smtp_user', '', 'string'),
  ('smtp_password', '', 'string'),
  ('smtp_from_email', '', 'string'),
  ('smtp_from_name', 'Luma Yazılım', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- 16. Insert default email templates
-- ============================================================================
INSERT INTO email_templates (template_key, name, subject, body_html, variables) VALUES
  ('invoice_created', 'Fatura Oluşturuldu', 'Yeni Faturanız Oluşturuldu - {{invoice_number}}', '<h2>Sayın {{customer_name}},</h2><p>{{invoice_number}} numaralı faturanız oluşturulmuştur.</p><p>Tutar: {{total}} {{currency}}</p><p>Son Ödeme Tarihi: {{due_date}}</p><p><a href="{{invoice_url}}">Faturayı Görüntüle</a></p>', '{customer_name,invoice_number,total,currency,due_date,invoice_url}'),
  ('invoice_reminder', 'Fatura Hatırlatma', 'Fatura Hatırlatması - {{invoice_number}}', '<h2>Sayın {{customer_name}},</h2><p>{{invoice_number}} numaralı faturanızın son ödeme tarihi {{due_date}} olarak belirlenmiştir.</p><p>Tutar: {{total}} {{currency}}</p><p><a href="{{invoice_url}}">Şimdi Öde</a></p>', '{customer_name,invoice_number,total,currency,due_date,invoice_url}'),
  ('invoice_overdue', 'Fatura Vadesi Geçti', 'Vadesi Geçmiş Fatura - {{invoice_number}}', '<h2>Sayın {{customer_name}},</h2><p>{{invoice_number}} numaralı faturanızın vadesi {{due_date}} tarihinde geçmiştir.</p><p>Tutar: {{total}} {{currency}}</p><p>Lütfen en kısa sürede ödeme yapınız.</p><p><a href="{{invoice_url}}">Şimdi Öde</a></p>', '{customer_name,invoice_number,total,currency,due_date,invoice_url}'),
  ('service_suspended', 'Hizmet Askıya Alındı', 'Hizmetiniz Askıya Alındı', '<h2>Sayın {{customer_name}},</h2><p>Ödenmemiş fatura nedeniyle {{service_name}} hizmetiniz askıya alınmıştır.</p><p>Hizmetinizi yeniden aktifleştirmek için lütfen ödemenizi yapınız.</p>', '{customer_name,service_name,invoice_url}'),
  ('service_activated', 'Hizmet Aktifleştirildi', 'Hizmetiniz Aktifleştirildi', '<h2>Sayın {{customer_name}},</h2><p>{{service_name}} hizmetiniz başarıyla aktifleştirilmiştir.</p>', '{customer_name,service_name}'),
  ('welcome', 'Hoş Geldiniz', 'Luma Yazılım''a Hoş Geldiniz!', '<h2>Sayın {{customer_name}},</h2><p>Luma Yazılım''a hoş geldiniz!</p><p>Hesabınız başarıyla oluşturulmuştur.</p>', '{customer_name}')
ON CONFLICT (template_key) DO NOTHING;

-- ============================================================================
-- 17. Insert default cron jobs
-- ============================================================================
INSERT INTO cron_jobs (job_name, description, schedule) VALUES
  ('auto_invoice', 'Otomatik fatura oluşturma', '0 2 * * *'),
  ('auto_suspend', 'Vadesi geçmiş faturaları askıya alma', '0 3 * * *'),
  ('auto_terminate', 'Uzun süreli askıdaki hesapları iptal etme', '0 4 * * *'),
  ('email_reminders', 'Fatura hatırlatma e-postaları', '0 9 * * *'),
  ('late_fees', 'Gecikme faizi uygulama', '0 1 * * *'),
  ('provision_services', 'Servis kurulum kuyruğu işleme', '*/10 * * * *')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 18. Insert default ticket departments
-- ============================================================================
INSERT INTO ticket_departments (name, slug, description, sort_order) VALUES
  ('Teknik Destek', 'teknik', 'Hosting, sunucu ve teknik sorunlar', 1),
  ('Faturalandırma', 'fatura', 'Fatura ve ödeme sorunları', 2),
  ('Satış', 'satis', 'Satış öncesi sorular ve teklifler', 3),
  ('Domain', 'domain', 'Domain kayıt ve yönetim sorunları', 4),
  ('Genel', 'genel', 'Genel sorular ve talepler', 5)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 19. RLS Policies
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE cron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE provisioning_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transfer_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE dns_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_transfers ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- cron_jobs: admin only
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can manage cron_jobs"
  ON cron_jobs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- cron_job_logs: admin only
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can manage cron_job_logs"
  ON cron_job_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- email_templates: admin read/write
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can manage email_templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- email_logs: admin only
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can manage email_logs"
  ON email_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- provisioning_queue: admin full access, customers read own
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can manage provisioning_queue"
  ON provisioning_queue FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Customers can view their own provisioning_queue"
  ON provisioning_queue FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- bank_transfer_confirmations: admin full access, customers read/insert own
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can manage bank_transfer_confirmations"
  ON bank_transfer_confirmations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Customers can view their own bank_transfer_confirmations"
  ON bank_transfer_confirmations FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can insert their own bank_transfer_confirmations"
  ON bank_transfer_confirmations FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ticket_departments: all authenticated users can read
-- ---------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view ticket_departments"
  ON ticket_departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage ticket_departments"
  ON ticket_departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- kb_categories: public read for active, admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "Anyone can view active kb_categories"
  ON kb_categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage kb_categories"
  ON kb_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- kb_articles: public read for published, admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "Anyone can view published kb_articles"
  ON kb_articles FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Admins can manage kb_articles"
  ON kb_articles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- announcements: public read for active, admin write
-- ---------------------------------------------------------------------------
CREATE POLICY "Anyone can view active announcements"
  ON announcements FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at >= now()));

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- server_status: public read
-- ---------------------------------------------------------------------------
CREATE POLICY "Anyone can view server_status"
  ON server_status FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage server_status"
  ON server_status FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- dns_records: admin full access, customers read own (via domain ownership)
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can manage dns_records"
  ON dns_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Customers can view their own dns_records"
  ON dns_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM domains
      WHERE domains.id = dns_records.domain_id
      AND domains.customer_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- domain_transfers: admin full access, customers read/insert own
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can manage domain_transfers"
  ON domain_transfers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Customers can view their own domain_transfers"
  ON domain_transfers FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can insert their own domain_transfers"
  ON domain_transfers FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- ============================================================================
-- 20. Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_job_id ON cron_job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_key ON email_logs(template_key);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_provisioning_queue_status ON provisioning_queue(status);
CREATE INDEX IF NOT EXISTS idx_bank_transfer_status ON bank_transfer_confirmations(status);
CREATE INDEX IF NOT EXISTS idx_hosting_next_invoice ON hosting(next_invoice_date);
CREATE INDEX IF NOT EXISTS idx_domains_next_invoice ON domains(next_invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_related_service ON invoices(related_service_id, related_service_type);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kb_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_status ON kb_articles(status);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_dns_records_domain ON dns_records(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_transfers_customer ON domain_transfers(customer_id);
