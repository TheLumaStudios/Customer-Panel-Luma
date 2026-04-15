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
  type TEXT NOT NULL CHECK (type IN ('invoice_due', 'server_down', 'ticket_reply', 'announcement', 'general')),
  title TEXT NOT NULL,
  body TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'clicked')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- notification_preferences tablosu
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  invoice_due BOOLEAN DEFAULT true,
  server_down BOOLEAN DEFAULT true,
  ticket_reply BOOLEAN DEFAULT true,
  announcement BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users manage own subscriptions
CREATE POLICY "user_manage_own_push" ON push_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- Admin full access
CREATE POLICY "admin_full_push" ON push_subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users read own notifications
CREATE POLICY "user_read_own_notifications" ON notification_log FOR SELECT
  USING (user_id = auth.uid());

-- Admin full on notifications
CREATE POLICY "admin_full_notifications" ON notification_log FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Service role insert
CREATE POLICY "service_insert_notifications" ON notification_log FOR INSERT WITH CHECK (true);

-- Users manage own preferences
CREATE POLICY "user_manage_own_prefs" ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- Admin read all
CREATE POLICY "admin_read_prefs" ON notification_preferences FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
