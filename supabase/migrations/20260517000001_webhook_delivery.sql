-- Webhook logs: status ve retry alanları eklendi
ALTER TABLE webhook_logs
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'failed')),
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Retry için index
CREATE INDEX IF NOT EXISTS idx_webhook_logs_retry
  ON webhook_logs(status, next_retry_at)
  WHERE status = 'failed';

-- Mevcut kayıtlar: response_status varsa delivered, yoksa pending
UPDATE webhook_logs
  SET status = CASE
    WHEN response_status IS NOT NULL AND response_status < 300 THEN 'delivered'
    WHEN response_status IS NOT NULL THEN 'failed'
    ELSE 'pending'
  END;
