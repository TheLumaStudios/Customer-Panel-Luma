-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL,
  name text NOT NULL,
  key_prefix text NOT NULL, -- first 8 chars for identification
  key_hash text NOT NULL, -- SHA256 hash of the full key
  permissions text[] DEFAULT '{read}', -- read, write, admin
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- API Logs
CREATE TABLE IF NOT EXISTS api_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id uuid REFERENCES api_keys(id) ON DELETE SET NULL,
  method text NOT NULL,
  endpoint text NOT NULL,
  status_code integer,
  ip_address text,
  response_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL,
  url text NOT NULL,
  events text[] DEFAULT '{}', -- invoice.created, invoice.paid, hosting.suspended, etc.
  secret text NOT NULL, -- for HMAC signature
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Webhook Logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id uuid REFERENCES webhooks(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb,
  response_status integer,
  response_body text,
  attempts integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Customers see own, admins see all
CREATE POLICY "Users can manage own api_keys" ON api_keys FOR ALL TO authenticated
  USING (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own api_logs" ON api_logs FOR SELECT TO authenticated
  USING (api_key_id IN (SELECT id FROM api_keys WHERE customer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can manage own webhooks" ON webhooks FOR ALL TO authenticated
  USING (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own webhook_logs" ON webhook_logs FOR SELECT TO authenticated
  USING (webhook_id IN (SELECT id FROM webhooks WHERE customer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_customer ON api_keys(customer_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_logs_key ON api_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhooks_customer ON webhooks(customer_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON webhook_logs(webhook_id);
