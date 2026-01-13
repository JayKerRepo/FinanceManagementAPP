/*
  # Investments Schema Migration
  
  Creates tables for investment tracking:
  1. investments - Individual holdings (stocks, ETFs, etc.)
  2. investment_accounts - Investment accounts (Robinhood, etc.)
  3. investment_performance_history - Historical performance tracking
  
  Includes RLS policies and indexes for performance.
  This migration is idempotent and safe to run multiple times.
*/

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Investment accounts summary table
CREATE TABLE IF NOT EXISTS public.investment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'brokerage', -- brokerage, ira, 401k, etc.
  provider TEXT NOT NULL, -- robinhood, etrade, etc.
  provider_account_id TEXT,
  
  -- Aggregated values
  total_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_cost_basis NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_gain_loss NUMERIC(15, 2) GENERATED ALWAYS AS (total_value - total_cost_basis) STORED,
  
  -- Sync settings
  is_active BOOLEAN DEFAULT TRUE,
  auto_sync BOOLEAN DEFAULT TRUE,
  sync_frequency TEXT DEFAULT 'daily', -- hourly, daily, weekly
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- OAuth tokens (encrypted in production)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investments table
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  investment_account_id UUID REFERENCES public.investment_accounts(id) ON DELETE CASCADE,
  
  -- Investment details
  symbol TEXT NOT NULL, -- AAPL, TSLA, etc.
  quantity NUMERIC(15, 6) NOT NULL DEFAULT 0,
  average_cost_basis NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_value NUMERIC(15, 2) NOT NULL DEFAULT 0, -- quantity * current_price
  total_cost_basis NUMERIC(15, 2) NOT NULL DEFAULT 0, -- quantity * average_cost_basis
  
  -- Performance metrics (computed columns)
  unrealized_gain_loss NUMERIC(15, 2) GENERATED ALWAYS AS (current_value - total_cost_basis) STORED,
  unrealized_gain_loss_percent NUMERIC(10, 4) GENERATED ALWAYS AS (
    CASE 
      WHEN total_cost_basis > 0 
      THEN ((current_value - total_cost_basis) / total_cost_basis * 100)
      ELSE 0
    END
  ) STORED,
  
  -- Metadata
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  provider_account_id TEXT, -- External account ID from provider
  provider_security_id TEXT, -- External security ID
  security_name TEXT,
  security_type TEXT DEFAULT 'stock', -- stock, etf, crypto, etc.
  sector TEXT,
  industry TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investment performance history table
CREATE TABLE IF NOT EXISTS public.investment_performance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  investment_account_id UUID REFERENCES public.investment_accounts(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  total_value NUMERIC(15, 2) NOT NULL,
  total_cost_basis NUMERIC(15, 2) NOT NULL,
  total_gain_loss NUMERIC(15, 2) NOT NULL,
  total_gain_loss_percent NUMERIC(10, 4) NOT NULL,
  
  -- Daily changes
  day_change NUMERIC(15, 2) DEFAULT 0,
  day_change_percent NUMERIC(10, 4) DEFAULT 0,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop existing unique constraint if it exists (to fix NULL handling)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'investments_investment_account_id_symbol_provider_security_id_key'
  ) THEN
    ALTER TABLE public.investments 
    DROP CONSTRAINT investments_investment_account_id_symbol_provider_security_id_key;
  END IF;
END $$;

-- Create unique constraint that handles NULLs properly
-- Only enforce uniqueness when investment_account_id is not NULL
DROP INDEX IF EXISTS idx_investments_unique_holding;
CREATE UNIQUE INDEX idx_investments_unique_holding 
ON public.investments(investment_account_id, symbol, provider_security_id)
WHERE investment_account_id IS NOT NULL;

-- Create unique constraint for user-level uniqueness when account_id is NULL
DROP INDEX IF EXISTS idx_investments_unique_user_symbol;
CREATE UNIQUE INDEX idx_investments_unique_user_symbol
ON public.investments(user_id, symbol, provider_security_id)
WHERE investment_account_id IS NULL;

-- Drop existing unique constraint on performance history if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'investment_performance_history_user_id_investment_account_id_date_key'
  ) THEN
    ALTER TABLE public.investment_performance_history 
    DROP CONSTRAINT investment_performance_history_user_id_investment_account_id_date_key;
  END IF;
END $$;

-- Create unique constraint for performance history
DROP INDEX IF EXISTS idx_investment_performance_unique;
CREATE UNIQUE INDEX idx_investment_performance_unique
ON public.investment_performance_history(user_id, investment_account_id, date);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_business_id ON public.investments(business_id);
CREATE INDEX IF NOT EXISTS idx_investments_account_id ON public.investments(investment_account_id);
CREATE INDEX IF NOT EXISTS idx_investments_symbol ON public.investments(symbol);
CREATE INDEX IF NOT EXISTS idx_investment_accounts_user_id ON public.investment_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_accounts_business_id ON public.investment_accounts(business_id);
CREATE INDEX IF NOT EXISTS idx_investment_performance_user_date ON public.investment_performance_history(user_id, date);
CREATE INDEX IF NOT EXISTS idx_investment_performance_account_date ON public.investment_performance_history(investment_account_id, date);

-- RLS Policies (drop and recreate for idempotency)
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_performance_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users read own investments" ON public.investments;
DROP POLICY IF EXISTS "Users insert own investments" ON public.investments;
DROP POLICY IF EXISTS "Users update own investments" ON public.investments;
DROP POLICY IF EXISTS "Users delete own investments" ON public.investments;

DROP POLICY IF EXISTS "Users read own investment accounts" ON public.investment_accounts;
DROP POLICY IF EXISTS "Users insert own investment accounts" ON public.investment_accounts;
DROP POLICY IF EXISTS "Users update own investment accounts" ON public.investment_accounts;
DROP POLICY IF EXISTS "Users delete own investment accounts" ON public.investment_accounts;

DROP POLICY IF EXISTS "Users read own performance history" ON public.investment_performance_history;
DROP POLICY IF EXISTS "Users insert own performance history" ON public.investment_performance_history;

-- Investments RLS
CREATE POLICY "Users read own investments"
ON public.investments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users insert own investments"
ON public.investments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own investments"
ON public.investments FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own investments"
ON public.investments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Investment accounts RLS
CREATE POLICY "Users read own investment accounts"
ON public.investment_accounts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users insert own investment accounts"
ON public.investment_accounts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own investment accounts"
ON public.investment_accounts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own investment accounts"
ON public.investment_accounts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Performance history RLS
CREATE POLICY "Users read own performance history"
ON public.investment_performance_history FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users insert own performance history"
ON public.investment_performance_history FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_investments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_investments_updated_at ON public.investments;
CREATE TRIGGER update_investments_updated_at
BEFORE UPDATE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION update_investments_updated_at();

DROP TRIGGER IF EXISTS update_investment_accounts_updated_at ON public.investment_accounts;
CREATE TRIGGER update_investment_accounts_updated_at
BEFORE UPDATE ON public.investment_accounts
FOR EACH ROW
EXECUTE FUNCTION update_investments_updated_at();
