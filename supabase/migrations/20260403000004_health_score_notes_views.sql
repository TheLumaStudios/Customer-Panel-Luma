-- ============================================================================
-- Customer Health Score, Internal Notes, Saved Views
-- ============================================================================

-- Müşteri sağlık skoru (0-100)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS health_score integer DEFAULT 50;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS health_score_updated_at timestamptz;

-- İç notlar (müşterinin göremeyeceği)
CREATE TABLE IF NOT EXISTS internal_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL, -- customer, invoice, hosting, ticket, domain
  entity_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  mentions uuid[] DEFAULT '{}', -- mentioned user IDs
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage internal_notes" ON internal_notes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')));

CREATE INDEX idx_internal_notes_entity ON internal_notes(entity_type, entity_id);
CREATE INDEX idx_internal_notes_author ON internal_notes(author_id);

-- Kaydedilmiş görünümler
CREATE TABLE IF NOT EXISTS saved_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  entity_type text NOT NULL, -- customers, invoices, hosting, domains, tickets
  filters jsonb NOT NULL DEFAULT '[]',
  sorting jsonb DEFAULT '[]',
  columns jsonb DEFAULT '[]', -- visible columns
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saved_views" ON saved_views FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_saved_views_user ON saved_views(user_id, entity_type);

-- Sağlık skoru hesaplama fonksiyonu
CREATE OR REPLACE FUNCTION calculate_customer_health_score(p_customer_id uuid)
RETURNS integer AS $$
DECLARE
  _score integer := 50;
  _overdue_count integer;
  _paid_on_time_rate numeric;
  _ticket_count integer;
  _days_since_last_payment integer;
  _active_services integer;
BEGIN
  -- Vadesi geçmiş fatura sayısı (-10 her biri, max -30)
  SELECT COUNT(*) INTO _overdue_count
  FROM invoices
  WHERE customer_id = p_customer_id AND status = 'unpaid' AND due_date < now();
  _score := _score - LEAST(_overdue_count * 10, 30);

  -- Zamanında ödeme oranı (+20 max)
  SELECT
    CASE WHEN COUNT(*) > 0
      THEN (COUNT(*) FILTER (WHERE paid_date <= due_date)::numeric / COUNT(*)::numeric)
      ELSE 0.5
    END INTO _paid_on_time_rate
  FROM invoices
  WHERE customer_id = p_customer_id AND status = 'paid';
  _score := _score + ROUND(_paid_on_time_rate * 20)::integer;

  -- Son 30 günde açılan ticket sayısı (-5 her biri, max -15, +5 eğer hiç yoksa)
  SELECT COUNT(*) INTO _ticket_count
  FROM support_tickets
  WHERE customer_id = p_customer_id AND created_at > now() - interval '30 days';
  IF _ticket_count = 0 THEN
    _score := _score + 5;
  ELSE
    _score := _score - LEAST(_ticket_count * 5, 15);
  END IF;

  -- Son ödeme tarihi (+10 son 30 gün, -10 90 günden eski)
  SELECT EXTRACT(DAY FROM now() - MAX(paid_date))::integer INTO _days_since_last_payment
  FROM invoices
  WHERE customer_id = p_customer_id AND status = 'paid';
  IF _days_since_last_payment IS NOT NULL THEN
    IF _days_since_last_payment <= 30 THEN _score := _score + 10;
    ELSIF _days_since_last_payment > 90 THEN _score := _score - 10;
    END IF;
  END IF;

  -- Aktif hizmet sayısı (+5 her biri, max +15)
  SELECT COUNT(*) INTO _active_services
  FROM hosting WHERE customer_id = p_customer_id AND status = 'active';
  _active_services := _active_services + (SELECT COUNT(*) FROM domains WHERE customer_id = p_customer_id AND status = 'active');
  _score := _score + LEAST(_active_services * 5, 15);

  -- 0-100 arası sınırla
  _score := GREATEST(0, LEAST(100, _score));

  -- Güncelle
  UPDATE customers SET health_score = _score, health_score_updated_at = now()
  WHERE id = p_customer_id;

  RETURN _score;
END;
$$ LANGUAGE plpgsql;
