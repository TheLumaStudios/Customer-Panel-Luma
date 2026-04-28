-- Trigger fonksiyonunu hardcoded URL/key ile yeniden oluştur
-- anon key public olduğu için güvenli

CREATE OR REPLACE FUNCTION trigger_meta_catalog_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_url  text := 'https://pbgajlkaulxrspyptzzs.supabase.co/functions/v1/meta-catalog-sync';
  anon_key  text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZ2FqbGthdWx4cnNweXB0enpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NzIzNDYsImV4cCI6MjA4ODE0ODM0Nn0.3gOjcLj6G_jhdE_Jf4zZJEPwxmD0p4fGeoO-w-imDtA';
  product_id text;
  sync_mode  text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    product_id := OLD.id::text;
    sync_mode  := 'delete';
  ELSE
    product_id := NEW.id::text;
    sync_mode  := 'single';
  END IF;

  PERFORM net.http_post(
    url     := edge_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'apikey',        anon_key,
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
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
