-- Immutable audit log - silinemez, değiştirilemez
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid, -- kim yaptı (user id)
  actor_email text,
  actor_role text, -- admin, employee, customer, system
  action text NOT NULL, -- create, update, delete, suspend, unsuspend, login, payment, etc.
  entity_type text NOT NULL, -- customer, invoice, hosting, domain, ticket, server, etc.
  entity_id uuid,
  entity_name text, -- human readable (customer name, domain name, etc.)
  changes jsonb, -- { field: { old: x, new: y } }
  metadata jsonb, -- extra context
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS: admin/employee can read, nobody can update/delete
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Sadece INSERT izni (immutable)
CREATE POLICY "System can insert audit_logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admin ve employee okuyabilir
CREATE POLICY "Admin/Employee can view audit_logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'employee')
    )
  );

-- UPDATE ve DELETE yasakla (policy olmadığı için zaten yasak ama explicit olsun)
-- Hiçbir policy tanımlanmadığında RLS default deny'dır

-- Indexes
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Trigger: Otomatik audit log for critical tables
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  _actor_id uuid;
  _changes jsonb;
BEGIN
  _actor_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, changes)
    VALUES (_actor_id, 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Sadece değişen alanları kaydet
    _changes := jsonb_build_object();
    IF to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) THEN
      _changes := jsonb_strip_nulls(
        jsonb_build_object(
          'old', to_jsonb(OLD),
          'new', to_jsonb(NEW)
        )
      );
    END IF;
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, changes)
    VALUES (_actor_id, 'update', TG_TABLE_NAME, NEW.id, _changes);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, changes)
    VALUES (_actor_id, 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kritik tablolara trigger ekle
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_hosting AFTER INSERT OR UPDATE OR DELETE ON hosting
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_domains AFTER INSERT OR UPDATE OR DELETE ON domains
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_customers AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_support_tickets AFTER INSERT OR UPDATE OR DELETE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- =============================================
-- Webhook idempotency table
-- =============================================
CREATE TABLE IF NOT EXISTS processed_webhooks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id text UNIQUE NOT NULL, -- iyzico conversation_id, payment token, etc.
  source text NOT NULL, -- 'iyzico', 'paytr', 'stripe', 'resellers_panel'
  event_type text, -- 'payment.success', 'payment.failed', etc.
  payload jsonb,
  processed_at timestamptz DEFAULT now(),
  result jsonb -- what we did (invoice_id created, hosting activated, etc.)
);

CREATE INDEX idx_processed_webhooks_id ON processed_webhooks(webhook_id);

ALTER TABLE processed_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can view processed_webhooks"
  ON processed_webhooks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "System can insert processed_webhooks"
  ON processed_webhooks FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================
-- Rate limit tracking
-- =============================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL, -- 'ip:1.2.3.4:domain-check' or 'user:uuid:cf-zone-create'
  count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_rate_limits_expires ON rate_limits(expires_at);

-- Cleanup expired entries (run periodically)
CREATE OR REPLACE FUNCTION cleanup_rate_limits() RETURNS void AS $$
  DELETE FROM rate_limits WHERE expires_at < now();
$$ LANGUAGE sql;

-- Rate limit check function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key text,
  p_max_requests integer DEFAULT 30,
  p_window_seconds integer DEFAULT 60
) RETURNS boolean AS $$
DECLARE
  _count integer;
  _window_start timestamptz;
BEGIN
  -- Cleanup old entries
  DELETE FROM rate_limits WHERE key = p_key AND expires_at < now();

  -- Get current count
  SELECT count, window_start INTO _count, _window_start
  FROM rate_limits WHERE key = p_key;

  IF _count IS NULL THEN
    -- First request
    INSERT INTO rate_limits (key, count, window_start, expires_at)
    VALUES (p_key, 1, now(), now() + (p_window_seconds || ' seconds')::interval);
    RETURN true;
  ELSIF _count >= p_max_requests THEN
    -- Limit exceeded
    RETURN false;
  ELSE
    -- Increment
    UPDATE rate_limits SET count = count + 1 WHERE key = p_key;
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql;
