-- ============================================================================
-- Workspaces (Projeler/Ortamlar) + White-Label Raporlama
-- ============================================================================

-- Müşteri workspace'leri (alt proje gruplaması)
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL,
  name text NOT NULL, -- 'SeferX Yemek', 'SeferX Logistics'
  slug text NOT NULL,
  description text,
  color text DEFAULT '#4F46E5', -- hex color for visual grouping
  icon text DEFAULT 'folder', -- lucide icon name
  is_default boolean DEFAULT false, -- her müşterinin 1 default workspace'i olur
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspaces" ON workspaces FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')));
CREATE POLICY "Users can manage own workspaces" ON workspaces FOR ALL TO authenticated
  USING (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE UNIQUE INDEX idx_workspaces_slug ON workspaces(customer_id, slug);
CREATE INDEX idx_workspaces_customer ON workspaces(customer_id);

-- Hizmetleri workspace'e bağlama
ALTER TABLE hosting ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE domains ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE vds ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hosting_workspace ON hosting(workspace_id);
CREATE INDEX IF NOT EXISTS idx_domains_workspace ON domains(workspace_id);
CREATE INDEX IF NOT EXISTS idx_vds_workspace ON vds(workspace_id);

-- White-label müşteri ayarları
CREATE TABLE IF NOT EXISTS customer_branding (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL UNIQUE,
  company_name text,
  logo_url text, -- Supabase Storage'dan
  primary_color text DEFAULT '#4F46E5',
  secondary_color text DEFAULT '#7C3AED',
  footer_text text, -- PDF footer
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customer_branding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own branding" ON customer_branding FOR ALL TO authenticated
  USING (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Planlı bakım duyuruları - sunucu bazlı hedefleme
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_server_ids uuid[] DEFAULT '{}';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_customer_ids uuid[] DEFAULT '{}';

-- Uptime monitoring
CREATE TABLE IF NOT EXISTS uptime_checks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id uuid REFERENCES servers(id) ON DELETE CASCADE,
  url text NOT NULL, -- ping URL
  interval_seconds integer DEFAULT 60,
  is_active boolean DEFAULT true,
  last_check_at timestamptz,
  last_status text, -- 'up', 'down', 'degraded'
  last_response_ms integer,
  uptime_percent numeric(5,2) DEFAULT 100.00,
  consecutive_failures integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE uptime_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view uptime_checks" ON uptime_checks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin can manage uptime_checks" ON uptime_checks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TABLE IF NOT EXISTS uptime_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  check_id uuid REFERENCES uptime_checks(id) ON DELETE CASCADE,
  status text NOT NULL, -- 'up', 'down', 'degraded'
  response_ms integer,
  status_code integer,
  error_message text,
  checked_at timestamptz DEFAULT now()
);

CREATE INDEX idx_uptime_logs_check ON uptime_logs(check_id, checked_at DESC);

-- Auto-deploy webhook endpoints
CREATE TABLE IF NOT EXISTS deploy_hooks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL,
  hosting_id uuid REFERENCES hosting(id) ON DELETE CASCADE,
  vds_id uuid REFERENCES vds(id) ON DELETE CASCADE,
  hook_token text NOT NULL UNIQUE, -- random token for webhook URL
  name text NOT NULL DEFAULT 'Deploy Hook',
  commands jsonb DEFAULT '["git pull", "npm install", "npm run build", "pm2 restart all"]',
  branch text DEFAULT 'main',
  last_triggered_at timestamptz,
  trigger_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deploy_hooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own deploy_hooks" ON deploy_hooks FOR ALL TO authenticated
  USING (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_deploy_hooks_token ON deploy_hooks(hook_token);
CREATE INDEX idx_deploy_hooks_customer ON deploy_hooks(customer_id);
