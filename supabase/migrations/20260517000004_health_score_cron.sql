-- customers tablosuna health_score alanı (yoksa ekle)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS health_score integer DEFAULT 50
    CHECK (health_score BETWEEN 0 AND 100);

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS health_score_updated_at timestamptz;

-- Health score için index (düşük skorlu müşterileri hızlı bulmak için)
CREATE INDEX IF NOT EXISTS idx_customers_health_score ON customers(health_score);
