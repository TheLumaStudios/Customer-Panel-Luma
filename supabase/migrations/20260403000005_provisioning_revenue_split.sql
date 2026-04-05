-- ============================================================================
-- Live Provisioning Steps + Revenue Split + Upsell Triggers
-- ============================================================================

-- Provisioning step tracking (detayli kurulum adimlari)
CREATE TABLE IF NOT EXISTS provisioning_steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id uuid REFERENCES provisioning_queue(id) ON DELETE CASCADE,
  step_name text NOT NULL, -- 'creating_account', 'assigning_ip', 'installing_os', 'configuring_dns', 'completed'
  step_label text NOT NULL, -- Turkish display name
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE provisioning_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own provisioning_steps" ON provisioning_steps FOR SELECT TO authenticated
  USING (
    queue_id IN (SELECT id FROM provisioning_queue WHERE customer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee'))
  );
CREATE POLICY "System can manage provisioning_steps" ON provisioning_steps FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_provisioning_steps_queue ON provisioning_steps(queue_id);

-- Revenue Split (Gelir Paylasimi)
CREATE TABLE IF NOT EXISTS revenue_partners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  share_percent numeric(5,2) NOT NULL DEFAULT 0, -- 0-100
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revenue_splits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id uuid REFERENCES payments(id),
  invoice_id uuid REFERENCES invoices(id),
  partner_id uuid REFERENCES revenue_partners(id),
  gross_amount numeric(12,2) NOT NULL,
  partner_share numeric(12,2) NOT NULL,
  our_share numeric(12,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE revenue_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage revenue_partners" ON revenue_partners FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can manage revenue_splits" ON revenue_splits FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_revenue_splits_partner ON revenue_splits(partner_id);
CREATE INDEX idx_revenue_splits_invoice ON revenue_splits(invoice_id);

-- Upsell triggers - kaynak kullanimi takibi
ALTER TABLE hosting ADD COLUMN IF NOT EXISTS disk_usage_percent integer DEFAULT 0;
ALTER TABLE hosting ADD COLUMN IF NOT EXISTS bandwidth_usage_percent integer DEFAULT 0;
ALTER TABLE hosting ADD COLUMN IF NOT EXISTS cpu_usage_percent integer DEFAULT 0;
ALTER TABLE hosting ADD COLUMN IF NOT EXISTS upsell_dismissed_at timestamptz;

-- Milestone faturalama (yazilim projeleri)
CREATE TABLE IF NOT EXISTS project_milestones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL,
  project_name text NOT NULL,
  milestone_name text NOT NULL, -- 'Tasarim', 'Backend', 'Frontend', 'Test', 'Teslim'
  description text,
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'TRY',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'invoiced', 'paid', 'cancelled')),
  invoice_id uuid REFERENCES invoices(id),
  due_date date,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage milestones" ON project_milestones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')));
CREATE POLICY "Customer can view own milestones" ON project_milestones FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE INDEX idx_milestones_customer ON project_milestones(customer_id);
CREATE INDEX idx_milestones_status ON project_milestones(status);

-- Tek tikla kurulum sablonlari
CREATE TABLE IF NOT EXISTS server_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL, -- 'Laravel + Nginx', 'Node.js + PM2', 'WordPress'
  slug text NOT NULL UNIQUE,
  description text,
  icon text, -- emoji or icon name
  commands jsonb NOT NULL DEFAULT '[]', -- array of shell commands
  requirements text, -- 'Ubuntu 22.04+'
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE server_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active server_templates" ON server_templates FOR SELECT TO authenticated
  USING (is_active = true);
CREATE POLICY "Admin can manage server_templates" ON server_templates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed server templates
INSERT INTO server_templates (name, slug, description, icon, commands, requirements, sort_order) VALUES
('Laravel + Nginx', 'laravel-nginx', 'PHP 8.2, Composer, Laravel, Nginx, MySQL', '🔥', '["apt update", "apt install -y nginx php8.2-fpm php8.2-mysql composer mysql-server", "composer create-project laravel/laravel /var/www/app"]', 'Ubuntu 22.04+', 1),
('Node.js + PM2', 'nodejs-pm2', 'Node.js 20 LTS, PM2 process manager, Nginx reverse proxy', '🚀', '["curl -fsSL https://deb.nodesource.com/setup_20.x | bash -", "apt install -y nodejs nginx", "npm install -g pm2"]', 'Ubuntu 22.04+', 2),
('WordPress + LEMP', 'wordpress-lemp', 'WordPress, Nginx, MySQL, PHP, Let''s Encrypt SSL', '📝', '["apt update", "apt install -y nginx php8.2-fpm php8.2-mysql mysql-server", "wget https://wordpress.org/latest.tar.gz"]', 'Ubuntu 22.04+', 3),
('Python + Django', 'python-django', 'Python 3.11, Django, Gunicorn, Nginx, PostgreSQL', '🐍', '["apt install -y python3.11 python3-pip nginx postgresql", "pip install django gunicorn"]', 'Ubuntu 22.04+', 4),
('Docker + Portainer', 'docker-portainer', 'Docker Engine, Docker Compose, Portainer web UI', '🐳', '["curl -fsSL https://get.docker.com | sh", "docker run -d -p 9443:9443 portainer/portainer-ce"]', 'Ubuntu 22.04+', 5),
('Minecraft Server', 'minecraft', 'Java 17, Paper MC server, screen', '🎮', '["apt install -y openjdk-17-jre screen", "mkdir /opt/minecraft", "cd /opt/minecraft && wget https://api.papermc.io/v2/projects/paper/versions/1.21.4/builds/1/downloads/paper-1.21.4-1.jar"]', 'Ubuntu 22.04+, 2GB+ RAM', 6)
ON CONFLICT (slug) DO NOTHING;
