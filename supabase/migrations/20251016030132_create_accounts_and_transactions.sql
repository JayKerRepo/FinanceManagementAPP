/*
  # Accounts and Transactions Schema
  
  ## 3. Accounts Table
    - `id` (uuid, primary key)
    - `business_id` (uuid, foreign key)
    - `name` (text) - Account name
    - `account_type` (text) - checking, savings, credit_card, cash
    - `bank_name` (text) - Financial institution
    - `account_number` (text) - Last 4 digits
    - `balance` (numeric) - Current balance
    - `currency` (text) - Currency code
    - `is_active` (boolean) - Active status
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ## 4. Transactions Table
    - `id` (uuid, primary key)
    - `business_id` (uuid, foreign key)
    - `account_id` (uuid, foreign key)
    - `transaction_type` (text) - income, expense, transfer
    - `amount` (numeric) - Transaction amount
    - `currency` (text) - Currency code
    - `description` (text) - Transaction description
    - `category` (text) - Category name
    - `date` (date) - Transaction date
    - `is_tax_deductible` (boolean) - Tax status
    - `is_recurring` (boolean) - Recurring flag
    - `recurring_config` (jsonb) - Recurrence settings
    - `receipt_url` (text) - Receipt image URL
    - `notes` (text) - Additional notes
    - `split_config` (jsonb) - Split expense data
    - `tags` (text[]) - Transaction tags
    - `ai_category` (text) - AI-suggested category
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ## Security
    - RLS enabled on all tables
    - Users access data through their businesses
*/

-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit_card', 'cash', 'investment')),
  bank_name text,
  account_number text,
  balance numeric(15, 2) DEFAULT 0,
  currency text DEFAULT 'USD',
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  amount numeric(15, 2) NOT NULL,
  currency text DEFAULT 'USD',
  description text,
  category text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  is_tax_deductible boolean DEFAULT false,
  is_recurring boolean DEFAULT false,
  recurring_config jsonb DEFAULT NULL,
  receipt_url text,
  notes text,
  split_config jsonb DEFAULT NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  ai_category text,
  ai_confidence numeric(3, 2),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_business_id ON accounts(business_id);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_transactions_business_id ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(business_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(business_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_tax_deductible ON transactions(business_id, is_tax_deductible) WHERE is_tax_deductible = true;

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies deferred to later membership migration

-- RLS policies deferred to later membership migration

-- Triggers for updated_at
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update account balance on transaction
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.transaction_type = 'income' THEN
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.transaction_type = 'expense' THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.account_id = NEW.account_id THEN
      IF OLD.transaction_type = 'income' THEN
        UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
      ELSIF OLD.transaction_type = 'expense' THEN
        UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      END IF;
      
      IF NEW.transaction_type = 'income' THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.transaction_type = 'expense' THEN
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      END IF;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.transaction_type = 'income' THEN
      UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.transaction_type = 'expense' THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update account balance
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();
