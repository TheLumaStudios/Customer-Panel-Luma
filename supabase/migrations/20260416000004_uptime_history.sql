-- Public Uptime/Status Sayfası

-- uptime_checks tablosu
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS uptime_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID,
    status TEXT,
    response_time_ms INTEGER,
    check_location TEXT DEFAULT 'eu-west',
    checked_at TIMESTAMPTZ DEFAULT now()
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
-- Eksik kolonları güvenli ekle
ALTER TABLE uptime_checks ADD COLUMN IF NOT EXISTS server_id UUID;
ALTER TABLE uptime_checks ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE uptime_checks ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
ALTER TABLE uptime_checks ADD COLUMN IF NOT EXISTS check_location TEXT DEFAULT 'eu-west';
ALTER TABLE uptime_checks ADD COLUMN IF NOT EXISTS checked_at TIMESTAMPTZ DEFAULT now();

-- incidents tablosu
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  severity TEXT DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
  affected_servers UUID[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- incident_updates tablosu
CREATE TABLE IF NOT EXISTS incident_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_uptime_checks_server ON uptime_checks(server_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_uptime_checks_time ON uptime_checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incident_updates_incident ON incident_updates(incident_id);

-- RLS - Public SELECT (no auth required)
ALTER TABLE uptime_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;

-- Public read (drop + create to avoid conflict)
DROP POLICY IF EXISTS "public_read_uptime" ON uptime_checks;
CREATE POLICY "public_read_uptime" ON uptime_checks FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_incidents" ON incidents;
CREATE POLICY "public_read_incidents" ON incidents FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_incident_updates" ON incident_updates;
CREATE POLICY "public_read_incident_updates" ON incident_updates FOR SELECT USING (true);

-- Admin write
DROP POLICY IF EXISTS "admin_write_uptime" ON uptime_checks;
CREATE POLICY "admin_write_uptime" ON uptime_checks FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "admin_write_incidents" ON incidents;
CREATE POLICY "admin_write_incidents" ON incidents FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "admin_write_incident_updates" ON incident_updates;
CREATE POLICY "admin_write_incident_updates" ON incident_updates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Service role insert for cron
DROP POLICY IF EXISTS "service_insert_uptime" ON uptime_checks;
CREATE POLICY "service_insert_uptime" ON uptime_checks FOR INSERT WITH CHECK (true);
