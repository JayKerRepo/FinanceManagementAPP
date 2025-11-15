-- Performance indexes (idempotent)

CREATE INDEX IF NOT EXISTS idx_transactions_biz_date
ON public.transactions (business_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_biz_cat_date
ON public.transactions (business_id, category, date);

CREATE INDEX IF NOT EXISTS idx_expense_approvals_biz_status_submitted
ON public.expense_approvals (business_id, status, submitted_at DESC);






