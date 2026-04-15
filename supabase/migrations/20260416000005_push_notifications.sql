-- Push Notifications (PWA)

-- push_subscriptions tablosu
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- notification_log tablosu
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT,
  title TEXT,
  body TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';

-- notification_preferences tablosu
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  invoice_due BOOLEAN DEFAULT true,
  server_down BOOLEAN DEFAULT true,
  ticket_reply BOOLEAN DEFAULT true,
  announcement BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS invoice_due BOOLEAN DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS server_down BOOLEAN DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS ticket_reply BOOLEAN DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS announcement BOOLEAN DEFAULT true;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies (drop + create to avoid conflicts)
DROP POLICY IF EXISTS "user_manage_own_push" ON push_subscriptions;
CREATE POLICY "user_manage_own_push" ON push_subscriptions FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_full_push" ON push_subscriptions;
CREATE POLICY "admin_full_push" ON push_subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "user_read_own_notifications" ON notification_log;
CREATE POLICY "user_read_own_notifications" ON notification_log FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_full_notifications" ON notification_log;
CREATE POLICY "admin_full_notifications" ON notification_log FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "service_insert_notifications" ON notification_log;
CREATE POLICY "service_insert_notifications" ON notification_log FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "user_manage_own_prefs" ON notification_preferences;
DO $$ BEGIN
  CREATE POLICY "user_manage_own_prefs" ON notification_preferences FOR ALL
    USING (user_id = auth.uid());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP POLICY IF EXISTS "admin_read_prefs" ON notification_preferences;
DO $$ BEGIN
  CREATE POLICY "admin_read_prefs" ON notification_preferences FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
