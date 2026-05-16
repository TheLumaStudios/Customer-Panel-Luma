-- Gerçek Zamanlı Resource Monitoring
-- Saatlik cPanel disk/bandwidth snapshot'ları

CREATE TABLE IF NOT EXISTS resource_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hosting_id uuid NOT NULL REFERENCES hosting(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  cpanel_username text NOT NULL,
  -- Disk (MB)
  disk_used_mb numeric,
  disk_limit_mb numeric,
  disk_pct numeric GENERATED ALWAYS AS (
    CASE WHEN disk_limit_mb > 0 THEN ROUND((disk_used_mb / disk_limit_mb) * 100, 2) ELSE NULL END
  ) STORED,
  -- Bandwidth (MB) — aylık
  bw_used_mb numeric,
  bw_limit_mb numeric,
  bw_pct numeric GENERATED ALWAYS AS (
    CASE WHEN bw_limit_mb > 0 THEN ROUND((bw_used_mb / bw_limit_mb) * 100, 2) ELSE NULL END
  ) STORED,
  -- İnodes
  inodes_used bigint,
  inodes_limit bigint,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Hosting başına son N snapshot'ı getirmek için index
CREATE INDEX IF NOT EXISTS idx_resource_snapshots_hosting
  ON resource_snapshots(hosting_id, snapshot_at DESC);

-- Yüksek disk kullanımını hızlı bulmak için
CREATE INDEX IF NOT EXISTS idx_resource_snapshots_disk_pct
  ON resource_snapshots(disk_pct DESC)
  WHERE disk_pct IS NOT NULL;

-- 30 günden eski snapshot'ları otomatik temizle (büyük veri birikimini önle)
-- Supabase cron ile çalıştırılır
CREATE OR REPLACE FUNCTION cleanup_old_snapshots()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM resource_snapshots
  WHERE snapshot_at < now() - interval '30 days';
END;
$$;

COMMENT ON TABLE resource_snapshots IS 'Saatlik cPanel disk ve bandwidth kullanım snapshot''ları';
