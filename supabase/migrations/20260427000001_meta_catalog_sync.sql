-- Meta Catalog Sync
-- product_packages tablosuna meta_synced_at kolonu ekler
-- ve her INSERT/UPDATE'de otomatik Meta kataloguna gönderir

-- 1. Meta sync takip kolonu
ALTER TABLE product_packages
  ADD COLUMN IF NOT EXISTS meta_synced_at timestamptz;

-- 2. pg_net extension (Supabase'de varsayılan olarak etkin)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Trigger function: ürün eklendiğinde/güncellendiğinde edge function'ı çağır
CREATE OR REPLACE FUNCTION trigger_meta_catalog_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_url text;
  anon_key text;
  product_id text;
  sync_mode text;
BEGIN
  -- Edge function URL
  edge_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/meta-catalog-sync';
  anon_key  := current_setting('app.settings.supabase_anon_key', true);

  -- DELETE işleminde eski ürünü Meta'dan kaldır
  IF TG_OP = 'DELETE' THEN
    product_id := OLD.id::text;
    sync_mode  := 'delete';
  ELSE
    product_id := NEW.id::text;
    sync_mode  := 'single';
  END IF;

  -- Fire-and-forget HTTP POST via pg_net
  PERFORM net.http_post(
    url     := edge_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', anon_key,
      'Authorization', 'Bearer ' || anon_key
    ),
    body    := jsonb_build_object(
      'mode',       sync_mode,
      'product_id', product_id
    )::text
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. INSERT ve UPDATE için trigger
DROP TRIGGER IF EXISTS meta_catalog_sync_trigger ON product_packages;
CREATE TRIGGER meta_catalog_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON product_packages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_meta_catalog_sync();

-- 5. Index for sync tracking
CREATE INDEX IF NOT EXISTS idx_product_packages_meta_sync
  ON product_packages(meta_synced_at)
  WHERE meta_synced_at IS NULL;
