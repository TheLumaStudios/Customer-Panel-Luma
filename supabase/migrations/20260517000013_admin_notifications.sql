-- Admin Notifications
-- Müşteri aksiyonlarında (havale bildirimi vb.) admin paneline düşen bildirimler

CREATE TABLE IF NOT EXISTS admin_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL,                          -- 'bank_transfer', 'ticket', 'new_order' vb.
  title       TEXT NOT NULL,
  message     TEXT,
  data        JSONB DEFAULT '{}',                    -- invoice_id, user_id, amount vb.
  is_read     BOOLEAN DEFAULT false,
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_read    ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications(created_at DESC);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Herhangi bir oturum açmış kullanıcı INSERT yapabilsin (müşteri bildirim göndersin)
CREATE POLICY "authenticated_insert_admin_notifications"
  ON admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Sadece admin/employee okuyabilsin
CREATE POLICY "admin_read_admin_notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'employee')
    )
  );

-- Sadece admin/employee okundu işaretleyebilsin
CREATE POLICY "admin_update_admin_notifications"
  ON admin_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'employee')
    )
  );
