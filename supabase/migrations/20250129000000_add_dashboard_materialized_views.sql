-- Materialized views for better performance on dashboard queries
-- These should be refreshed periodically (daily/hourly) depending on data volume

-- Daily transaction aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_transactions_agg AS
SELECT 
  business_id,
  date,
  SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expense,
  SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END) as net_profit,
  COUNT(*) as transaction_count
FROM transactions
GROUP BY business_id, date
ORDER BY business_id, date DESC;

-- Monthly category aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_category_agg AS
SELECT 
  business_id,
  DATE_TRUNC('month', date) as month,
  category,
  transaction_type,
  SUM(amount) as total_amount,
  COUNT(*) as transaction_count
FROM transactions
WHERE category IS NOT NULL
GROUP BY business_id, DATE_TRUNC('month', date), category, transaction_type
ORDER BY business_id, month DESC, total_amount DESC;

-- Budget utilization view
CREATE MATERIALIZED VIEW IF NOT EXISTS budget_utilization AS
SELECT 
  b.business_id,
  b.category,
  b.amount_limit,
  b.period_start,
  b.period_end,
  COALESCE(SUM(t.amount), 0) as used_amount,
  CASE 
    WHEN b.amount_limit > 0 THEN (COALESCE(SUM(t.amount), 0) / b.amount_limit) * 100
    ELSE 0 
  END as utilization_percentage
FROM budgets b
LEFT JOIN transactions t ON (
  b.business_id = t.business_id 
  AND t.category = b.category 
  AND t.transaction_type = 'expense'
  AND t.date BETWEEN b.period_start AND b.period_end
)
WHERE b.is_active = true
GROUP BY b.business_id, b.category, b.amount_limit, b.period_start, b.period_end;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_agg_business_date ON daily_transactions_agg(business_id, date);
CREATE INDEX IF NOT EXISTS idx_monthly_agg_business_month ON monthly_category_agg(business_id, month);
CREATE INDEX IF NOT EXISTS idx_budget_util_business ON budget_utilization(business_id);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW daily_transactions_agg;
  REFRESH MATERIALIZED VIEW monthly_category_agg;
  REFRESH MATERIALIZED VIEW budget_utilization;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (this would typically be done via pg_cron or external scheduler)
-- SELECT cron.schedule('refresh-dashboard-views', '0 */6 * * *', 'SELECT refresh_dashboard_views();');

-- Comments for documentation
COMMENT ON MATERIALIZED VIEW daily_transactions_agg IS 'Daily aggregates of income, expense, and net profit per business';
COMMENT ON MATERIALIZED VIEW monthly_category_agg IS 'Monthly aggregates by category and transaction type per business';
COMMENT ON MATERIALIZED VIEW budget_utilization IS 'Real-time budget utilization percentages per business and category';
COMMENT ON FUNCTION refresh_dashboard_views() IS 'Refreshes all dashboard materialized views - should be called periodically';

