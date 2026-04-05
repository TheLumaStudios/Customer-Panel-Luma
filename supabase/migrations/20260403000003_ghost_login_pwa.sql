-- Ghost login sessions
CREATE TABLE IF NOT EXISTS ghost_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 hour')
);

ALTER TABLE ghost_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage ghost_sessions" ON ghost_sessions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_ghost_sessions_admin ON ghost_sessions(admin_id);
