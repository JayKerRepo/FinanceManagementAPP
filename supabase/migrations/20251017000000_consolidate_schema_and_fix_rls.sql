/*
  # Schema Consolidation and RLS Fix Migration
  
  This migration consolidates the Option B business_members model by:
  1. Adding user_id to transactions table for audit trail
  2. Migrating businesses.user_id data to business_members
  3. Removing businesses.user_id column
  4. Creating RLS helper functions
  5. Updating all RLS policies to use membership functions instead of businesses.user_id
  
  This migration is idempotent and safe to run multiple times.
*/

-- Ensure categories table exists before applying policies
create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  icon text not null default 'tag',
  color text not null default '#808080',
  parent_id uuid references public.categories(id) on delete set null,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create index if not exists idx_categories_business_id
on public.categories(business_id);

-- Ensure budgets table exists before applying policies
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category text not null,
  amount_limit numeric(15, 2) not null,
  period_type text not null check (period_type in ('monthly','quarterly','yearly','custom')),
  period_start date not null,
  period_end date not null,
  alert_threshold numeric(5, 2) default 0,
  is_active boolean default true,
  rollover_unused boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.budgets enable row level security;

create index if not exists idx_budgets_business_id on public.budgets(business_id);

-- Ensure receipts table exists before applying policies
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  file_size bigint,
  mime_type text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.receipts enable row level security;

create index if not exists idx_receipts_transaction_id on public.receipts(transaction_id);

-- ============================================================================
-- Step 1: Add user_id to transactions table if missing
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
    ON public.transactions(user_id);
    
    CREATE INDEX IF NOT EXISTS idx_transactions_business_user 
    ON public.transactions(business_id, user_id);
  END IF;
END $$;

-- ============================================================================
-- Step 2: Helper functions (REPLACE with same signature from one-time repair)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_business_member(business_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = business_id
    AND bm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_owner(business_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = business_id
    AND bm.user_id = auth.uid()
    AND bm.role = 'owner'
  );
$$;

-- ============================================================================
-- Step 3: Migrate businesses.user_id to business_members if column exists
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'user_id'
  ) THEN
    -- Insert missing memberships from businesses.user_id
    INSERT INTO public.business_members (business_id, user_id, role)
    SELECT id, user_id, 'owner'
    FROM public.businesses
    WHERE user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = businesses.id AND bm.user_id = businesses.user_id
    )
    ON CONFLICT (business_id, user_id) DO NOTHING;
    
    -- Drop user_id column from businesses
    ALTER TABLE public.businesses DROP COLUMN IF EXISTS user_id;
    DROP INDEX IF EXISTS idx_businesses_user_id;
    DROP INDEX IF EXISTS idx_businesses_is_default;
    CREATE INDEX IF NOT EXISTS idx_businesses_is_default ON public.businesses(is_default);
  END IF;
END $$;

-- ============================================================================
-- Step 4: Update RLS policies for accounts and transactions
-- ============================================================================

-- Accounts RLS Policies
DROP POLICY IF EXISTS "Members read accounts" ON public.accounts;
CREATE POLICY "Members read accounts"
ON public.accounts FOR SELECT TO authenticated
USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Members insert accounts" ON public.accounts;
CREATE POLICY "Members insert accounts"
ON public.accounts FOR INSERT TO authenticated
WITH CHECK (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Members update accounts" ON public.accounts;
CREATE POLICY "Members update accounts"
ON public.accounts FOR UPDATE TO authenticated
USING (public.is_business_member(business_id))
WITH CHECK (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Members delete accounts" ON public.accounts;
CREATE POLICY "Members delete accounts"
ON public.accounts FOR DELETE TO authenticated
USING (public.is_business_member(business_id));

-- Transactions RLS Policies
DROP POLICY IF EXISTS "Members read transactions" ON public.transactions;
CREATE POLICY "Members read transactions"
ON public.transactions FOR SELECT TO authenticated
USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Members insert transactions" ON public.transactions;
CREATE POLICY "Members insert transactions"
ON public.transactions FOR INSERT TO authenticated
WITH CHECK (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Members update transactions" ON public.transactions;
CREATE POLICY "Members update transactions"
ON public.transactions FOR UPDATE TO authenticated
USING (public.is_business_member(business_id))
WITH CHECK (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Members delete transactions" ON public.transactions;
CREATE POLICY "Members delete transactions"
ON public.transactions FOR DELETE TO authenticated
USING (public.is_business_member(business_id));

-- ============================================================================
-- Step 5: Update RLS policies for categories
-- ============================================================================

DROP POLICY IF EXISTS "Users can view categories of their businesses" ON public.categories;
CREATE POLICY "Users can view categories of their businesses"
ON public.categories FOR SELECT TO authenticated
USING (
  is_system = true OR
  business_id IS NULL OR
  public.is_business_member(business_id)
);

DROP POLICY IF EXISTS "Users can create categories for their businesses" ON public.categories;
CREATE POLICY "Users can create categories for their businesses"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (
  business_id IS NULL OR
  public.is_business_member(business_id)
);

DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
CREATE POLICY "Users can update their own categories"
ON public.categories FOR UPDATE TO authenticated
USING (
  is_system = false AND
  (business_id IS NULL OR public.is_business_member(business_id))
)
WITH CHECK (
  business_id IS NULL OR public.is_business_member(business_id)
);

DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
CREATE POLICY "Users can delete their own categories"
ON public.categories FOR DELETE TO authenticated
USING (
  is_system = false AND
  (business_id IS NULL OR public.is_business_member(business_id))
);

-- ============================================================================
-- Step 6: Update RLS policies for budgets
-- ============================================================================

DROP POLICY IF EXISTS "Users can view budgets of their businesses" ON public.budgets;
CREATE POLICY "Users can view budgets of their businesses"
ON public.budgets FOR SELECT TO authenticated
USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Users can create budgets for their businesses" ON public.budgets;
CREATE POLICY "Users can create budgets for their businesses"
ON public.budgets FOR INSERT TO authenticated
WITH CHECK (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Users can update budgets of their businesses" ON public.budgets;
CREATE POLICY "Users can update budgets of their businesses"
ON public.budgets FOR UPDATE TO authenticated
USING (public.is_business_member(business_id))
WITH CHECK (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Users can delete budgets of their businesses" ON public.budgets;
CREATE POLICY "Users can delete budgets of their businesses"
ON public.budgets FOR DELETE TO authenticated
USING (public.is_business_member(business_id));

-- ============================================================================
-- Step 7: Update RLS policies for receipts
-- ============================================================================

DROP POLICY IF EXISTS "Users can view receipts of their transactions" ON public.receipts;
CREATE POLICY "Users can view receipts of their transactions"
ON public.receipts FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = receipts.transaction_id
    AND public.is_business_member(t.business_id)
  )
);

DROP POLICY IF EXISTS "Users can upload receipts to their transactions" ON public.receipts;
CREATE POLICY "Users can upload receipts to their transactions"
ON public.receipts FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = receipts.transaction_id
    AND public.is_business_member(t.business_id)
  )
);

DROP POLICY IF EXISTS "Users can delete receipts of their transactions" ON public.receipts;
CREATE POLICY "Users can delete receipts of their transactions"
ON public.receipts FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = receipts.transaction_id
    AND public.is_business_member(t.business_id)
  )
);

-- ============================================================================
-- Step 8: Update RLS policies for clients
-- ============================================================================

DROP POLICY IF EXISTS "Users can view clients of their businesses" ON public.clients;
CREATE POLICY "Users can view clients of their businesses"
ON public.clients FOR SELECT TO authenticated
USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Users can manage clients of their businesses" ON public.clients;
CREATE POLICY "Users can insert clients of their businesses"
ON public.clients FOR INSERT TO authenticated
WITH CHECK (public.is_business_member(business_id));

CREATE POLICY "Users can update clients of their businesses"
ON public.clients FOR UPDATE TO authenticated
USING (public.is_business_member(business_id))
WITH CHECK (public.is_business_member(business_id));

CREATE POLICY "Users can delete clients of their businesses"
ON public.clients FOR DELETE TO authenticated
USING (public.is_business_member(business_id));

-- ============================================================================
-- Step 9: Update RLS policies for invoices and related tables
-- ============================================================================

-- Invoices
DROP POLICY IF EXISTS "Users can view invoices of their businesses" ON public.invoices;
CREATE POLICY "Users can view invoices of their businesses"
ON public.invoices FOR SELECT TO authenticated
USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Users can create invoices for their businesses" ON public.invoices;
CREATE POLICY "Users can create invoices for their businesses"
ON public.invoices FOR INSERT TO authenticated
WITH CHECK (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Users can update invoices of their businesses" ON public.invoices;
CREATE POLICY "Users can update invoices of their businesses"
ON public.invoices FOR UPDATE TO authenticated
USING (public.is_business_member(business_id))
WITH CHECK (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Users can delete invoices of their businesses" ON public.invoices;
CREATE POLICY "Users can delete invoices of their businesses"
ON public.invoices FOR DELETE TO authenticated
USING (public.is_business_member(business_id));

-- Invoice Payments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_payments') THEN
    DROP POLICY IF EXISTS "Users can view invoice payments" ON public.invoice_payments;
    CREATE POLICY "Users can view invoice payments"
    ON public.invoice_payments FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.id = invoice_payments.invoice_id
        AND public.is_business_member(i.business_id)
      )
    );

    DROP POLICY IF EXISTS "Users can create invoice payments" ON public.invoice_payments;
    CREATE POLICY "Users can create invoice payments"
    ON public.invoice_payments FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.id = invoice_payments.invoice_id
        AND public.is_business_member(i.business_id)
      )
    );
  END IF;
END $$;

-- ============================================================================
-- Step 10: Update RLS policies for expense_approvals if table exists
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_approvals') THEN
    DROP POLICY IF EXISTS "Users can view expense approvals" ON public.expense_approvals;
    CREATE POLICY "Users can view expense approvals"
    ON public.expense_approvals FOR SELECT TO authenticated
    USING (
      public.is_business_member(business_id) OR
      submitter_id = auth.uid() OR
      approver_id = auth.uid()
    );

    DROP POLICY IF EXISTS "Users can create expense approvals" ON public.expense_approvals;
    CREATE POLICY "Users can create expense approvals"
    ON public.expense_approvals FOR INSERT TO authenticated
    WITH CHECK (
      submitter_id = auth.uid() AND
      public.is_business_member(business_id)
    );

    DROP POLICY IF EXISTS "Users can update expense approvals" ON public.expense_approvals;
    CREATE POLICY "Users can update expense approvals"
    ON public.expense_approvals FOR UPDATE TO authenticated
    USING (
      approver_id = auth.uid() OR
      (submitter_id = auth.uid() AND status = 'pending')
    )
    WITH CHECK (
      approver_id = auth.uid() OR
      (submitter_id = auth.uid() AND status = 'pending')
    );
  END IF;
END $$;

-- ============================================================================
-- Step 11: Update RLS policies for mileage_logs if table exists
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mileage_logs') THEN
    DROP POLICY IF EXISTS "Users can view mileage logs" ON public.mileage_logs;
    CREATE POLICY "Users can view mileage logs"
    ON public.mileage_logs FOR SELECT TO authenticated
    USING (
      user_id = auth.uid() OR
      public.is_business_member(business_id)
    );

    DROP POLICY IF EXISTS "Users can create mileage logs" ON public.mileage_logs;
    CREATE POLICY "Users can create mileage logs"
    ON public.mileage_logs FOR INSERT TO authenticated
    WITH CHECK (
      user_id = auth.uid() AND
      public.is_business_member(business_id)
    );

    DROP POLICY IF EXISTS "Users can update mileage logs" ON public.mileage_logs;
    CREATE POLICY "Users can update mileage logs"
    ON public.mileage_logs FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "Users can delete mileage logs" ON public.mileage_logs;
    CREATE POLICY "Users can delete mileage logs"
    ON public.mileage_logs FOR DELETE TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- Step 12: Update RLS policies for notifications if table exists
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
    CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT TO authenticated
    USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
    CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- Step 13: Safely refresh materialized views if they exist
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'daily_transactions_agg') THEN
    REFRESH MATERIALIZED VIEW public.daily_transactions_agg;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'monthly_transactions_agg') THEN
    REFRESH MATERIALIZED VIEW public.monthly_transactions_agg;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'category_transactions_agg') THEN
    REFRESH MATERIALIZED VIEW public.category_transactions_agg;
  END IF;
END $$;

