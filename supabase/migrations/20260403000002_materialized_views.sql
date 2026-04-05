-- ============================================================================
-- Materialized Views for Dashboard Performance
-- Her gece veya saatlik yenilenir, dashboard anında yüklenir
-- ============================================================================

-- Aylık gelir özeti (son 12 ay)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_revenue AS
SELECT
  date_trunc('month', paid_date)::date AS month,
  COUNT(*) AS invoice_count,
  SUM(total) AS total_revenue,
  SUM(CASE WHEN invoice_type = 'official' THEN total ELSE 0 END) AS official_revenue,
  SUM(CASE WHEN invoice_type = 'mukerrer_20b' THEN total ELSE 0 END) AS mukerrer_revenue,
  currency
FROM invoices
WHERE status = 'paid' AND paid_date IS NOT NULL
GROUP BY date_trunc('month', paid_date)::date, currency
ORDER BY month DESC
LIMIT 24;

-- MRR (Monthly Recurring Revenue) by package
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_mrr_breakdown AS
SELECT
  hp.package_name,
  hp.monthly_price,
  COUNT(h.id) AS active_count,
  SUM(hp.monthly_price) AS mrr_contribution,
  h.billing_cycle
FROM hosting h
JOIN hosting_packages hp ON h.package_id = hp.id
WHERE h.status = 'active'
GROUP BY hp.package_name, hp.monthly_price, h.billing_cycle;

-- Müşteri istatistikleri
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_customer_stats AS
SELECT
  1 AS id, -- unique key for index
  COUNT(*) AS total_customers,
  COUNT(*) FILTER (WHERE status = 'active') AS active_customers,
  COUNT(*) FILTER (WHERE customer_type = 'software') AS software_customers,
  COUNT(*) FILTER (WHERE customer_type = 'host') AS host_customers,
  COUNT(*) FILTER (WHERE created_at > now() - interval '30 days') AS new_last_30_days,
  COUNT(*) FILTER (WHERE created_at > now() - interval '7 days') AS new_last_7_days
FROM customers;

-- Fatura durum özeti
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_invoice_summary AS
SELECT
  1 AS id,
  COUNT(*) AS total_invoices,
  COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
  COUNT(*) FILTER (WHERE status = 'unpaid') AS unpaid_count,
  COUNT(*) FILTER (WHERE status = 'unpaid' AND due_date < now()) AS overdue_count,
  SUM(total) FILTER (WHERE status = 'paid') AS total_paid,
  SUM(total) FILTER (WHERE status = 'unpaid') AS total_unpaid,
  SUM(total) FILTER (WHERE status = 'paid' AND paid_date > now() - interval '30 days') AS revenue_last_30_days
FROM invoices;

-- Hizmet durumu özeti
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_service_stats AS
SELECT
  'hosting' AS service_type,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'active') AS active,
  COUNT(*) FILTER (WHERE status = 'suspended') AS suspended,
  COUNT(*) FILTER (WHERE expiration_date < now() + interval '30 days' AND status = 'active') AS expiring_soon
FROM hosting
UNION ALL
SELECT
  'domains',
  COUNT(*),
  COUNT(*) FILTER (WHERE status = 'active'),
  0,
  COUNT(*) FILTER (WHERE expiration_date < now() + interval '30 days' AND status = 'active')
FROM domains
UNION ALL
SELECT
  'vds',
  COUNT(*),
  COUNT(*) FILTER (WHERE status = 'active'),
  COUNT(*) FILTER (WHERE status = 'suspended'),
  0
FROM vds;

-- View'ları yenilemek için fonksiyon
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_monthly_revenue;
  REFRESH MATERIALIZED VIEW mv_mrr_breakdown;
  REFRESH MATERIALIZED VIEW mv_customer_stats;
  REFRESH MATERIALIZED VIEW mv_invoice_summary;
  REFRESH MATERIALIZED VIEW mv_service_stats;
END;
$$ LANGUAGE plpgsql;

-- Unique index'ler (CONCURRENTLY refresh için gerekli)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_monthly_revenue ON mv_monthly_revenue(month, currency);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_mrr_breakdown ON mv_mrr_breakdown(package_name, billing_cycle);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_customer_stats ON mv_customer_stats(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_invoice_summary ON mv_invoice_summary(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_service_stats ON mv_service_stats(service_type);

-- RLS for views (views don't need RLS, but grant access)
GRANT SELECT ON mv_monthly_revenue TO authenticated;
GRANT SELECT ON mv_mrr_breakdown TO authenticated;
GRANT SELECT ON mv_customer_stats TO authenticated;
GRANT SELECT ON mv_invoice_summary TO authenticated;
GRANT SELECT ON mv_service_stats TO authenticated;
