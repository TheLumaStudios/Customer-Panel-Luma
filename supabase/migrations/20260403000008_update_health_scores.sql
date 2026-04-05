-- ============================================================================
-- Gelişmiş Müşteri Sağlık Skoru Algoritması + Mevcut Skorları Güncelle
-- ============================================================================

-- Mevcut fonksiyonu drop edip yeniden oluştur
DROP FUNCTION IF EXISTS calculate_customer_health_score(uuid);

CREATE OR REPLACE FUNCTION calculate_customer_health_score(p_customer_id uuid)
RETURNS integer AS $$
DECLARE
  _score integer := 50; -- Başlangıç skoru
  _customer record;
  _overdue_count integer;
  _total_invoices integer;
  _paid_on_time integer;
  _paid_on_time_rate numeric;
  _ticket_count_30d integer;
  _days_since_last_payment integer;
  _active_hosting integer;
  _active_domains integer;
  _active_vds integer;
  _total_revenue numeric;
  _customer_age_days integer;
  _is_software boolean;
BEGIN
  -- Müşteri bilgisi
  SELECT * INTO _customer FROM customers WHERE id = p_customer_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  _is_software := _customer.customer_type = 'software';
  _customer_age_days := EXTRACT(DAY FROM now() - _customer.created_at)::integer;

  -- ═══ 1. ÖDEME DAVRANIŞI (max +30, min -30) ═══

  -- Vadesi geçmiş fatura sayısı (-12 her biri, max -30)
  SELECT COUNT(*) INTO _overdue_count
  FROM invoices WHERE customer_id = p_customer_id AND status = 'unpaid' AND due_date < now();
  _score := _score - LEAST(_overdue_count * 12, 30);

  -- Zamanında ödeme oranı (+25 max)
  SELECT COUNT(*), COUNT(*) FILTER (WHERE paid_date <= due_date + interval '2 days')
  INTO _total_invoices, _paid_on_time
  FROM invoices WHERE customer_id = p_customer_id AND status = 'paid' AND paid_date IS NOT NULL;

  IF _total_invoices > 0 THEN
    _paid_on_time_rate := _paid_on_time::numeric / _total_invoices::numeric;
    _score := _score + ROUND(_paid_on_time_rate * 25)::integer;
  ELSE
    -- Hiç faturası yoksa nötr (yeni müşteri)
    _score := _score + 5;
  END IF;

  -- ═══ 2. HİZMET AKTİFLİĞİ (max +20) ═══

  SELECT COUNT(*) INTO _active_hosting FROM hosting WHERE customer_id = p_customer_id AND status = 'active';
  SELECT COUNT(*) INTO _active_domains FROM domains WHERE customer_id = p_customer_id AND status = 'active';
  SELECT COUNT(*) INTO _active_vds FROM vds WHERE customer_id = p_customer_id AND status = 'active';

  -- Her aktif hizmet +4, max +20
  _score := _score + LEAST((_active_hosting + _active_domains + _active_vds) * 4, 20);

  -- ═══ 3. İLETİŞİM SIKLIĞI (max +10, min -10) ═══

  -- Son 30 günde açılan ticket sayısı
  SELECT COUNT(*) INTO _ticket_count_30d
  FROM support_tickets WHERE customer_id = p_customer_id AND created_at > now() - interval '30 days';

  IF _ticket_count_30d = 0 THEN
    _score := _score + 5; -- Sorunsuz müşteri
  ELSIF _ticket_count_30d <= 2 THEN
    _score := _score + 0; -- Normal
  ELSIF _ticket_count_30d <= 5 THEN
    _score := _score - 5; -- Sık sorun yaşıyor
  ELSE
    _score := _score - 10; -- Çok fazla sorun
  END IF;

  -- ═══ 4. GELİR KATKISI (max +15) ═══

  SELECT COALESCE(SUM(total), 0) INTO _total_revenue
  FROM invoices WHERE customer_id = p_customer_id AND status = 'paid';

  IF _total_revenue > 10000 THEN _score := _score + 15;      -- Yüksek gelir
  ELSIF _total_revenue > 5000 THEN _score := _score + 10;     -- Orta-yüksek
  ELSIF _total_revenue > 1000 THEN _score := _score + 5;      -- Orta
  ELSIF _total_revenue > 0 THEN _score := _score + 2;         -- Düşük
  END IF;

  -- ═══ 5. MÜŞTERİ YAŞI (max +10) ═══

  IF _customer_age_days > 365 THEN _score := _score + 10;     -- 1 yıl+
  ELSIF _customer_age_days > 180 THEN _score := _score + 7;   -- 6 ay+
  ELSIF _customer_age_days > 90 THEN _score := _score + 4;    -- 3 ay+
  ELSIF _customer_age_days > 30 THEN _score := _score + 2;    -- 1 ay+
  END IF;

  -- ═══ 6. SON ÖDEME (max +5, min -10) ═══

  SELECT EXTRACT(DAY FROM now() - MAX(paid_date))::integer INTO _days_since_last_payment
  FROM invoices WHERE customer_id = p_customer_id AND status = 'paid';

  IF _days_since_last_payment IS NOT NULL THEN
    IF _days_since_last_payment <= 30 THEN _score := _score + 5;      -- Yakın zamanda ödeme yapmış
    ELSIF _days_since_last_payment > 120 THEN _score := _score - 10;  -- Uzun süredir ödeme yok
    ELSIF _days_since_last_payment > 60 THEN _score := _score - 5;    -- Biraz uzun
    END IF;
  END IF;

  -- ═══ 7. YAZILIM MÜŞTERİSİ BONUSU ═══
  -- Yazılım müşterileri genelde uzun vadeli, +5 bonus
  IF _is_software THEN
    _score := _score + 5;
  END IF;

  -- 0-100 arası sınırla
  _score := GREATEST(0, LEAST(100, _score));

  -- Güncelle
  UPDATE customers SET health_score = _score, health_score_updated_at = now()
  WHERE id = p_customer_id;

  RETURN _score;
END;
$$ LANGUAGE plpgsql;

-- Tüm müşterilerin skorunu hesapla
DO $$
DECLARE
  _cust record;
BEGIN
  FOR _cust IN SELECT id FROM customers LOOP
    PERFORM calculate_customer_health_score(_cust.id);
  END LOOP;
END;
$$;

-- Cron job olarak ekle (saatlik)
INSERT INTO cron_jobs (job_name, description, schedule, is_active) VALUES
  ('health_scores', 'Tüm müşteri sağlık skorlarını yeniden hesapla', '0 */6 * * *', true)
ON CONFLICT (job_name) DO UPDATE SET description = EXCLUDED.description;
