/*
  # Budgets and Categories Schema
  
  ## 5. Categories Table
    - `id` (uuid, primary key)
    - `business_id` (uuid, foreign key)
    - `name` (text) - Category name
    - `type` (text) - income or expense
    - `icon` (text) - Icon name
    - `color` (text) - Display color
    - `parent_id` (uuid) - For subcategories
    - `is_system` (boolean) - System vs custom category
    - `created_at` (timestamptz)
  
  ## 6. Budgets Table
    - `id` (uuid, primary key)
    - `business_id` (uuid, foreign key)
    - `category` (text) - Category name
    - `amount_limit` (numeric) - Budget limit
    - `period_type` (text) - monthly, quarterly, yearly
    - `period_start` (date) - Period start date
    - `period_end` (date) - Period end date
    - `alert_threshold` (numeric) - Alert at % threshold
    - `is_active` (boolean) - Active status
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ## 7. Receipt Storage Table
    - `id` (uuid, primary key)
    - `transaction_id` (uuid, foreign key)
    - `file_url` (text) - Storage URL
    - `file_name` (text) - Original filename
    - `file_size` (bigint) - File size in bytes
    - `mime_type` (text) - File type
    - `created_at` (timestamptz)
  
  ## Security
    - RLS enabled on all tables
    - Users access through their businesses
*/

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text DEFAULT 'DollarSign',
  color text DEFAULT '#4F7CFF',
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount_limit numeric(15, 2) NOT NULL,
  period_type text NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly', 'custom')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  alert_threshold numeric(3, 2) DEFAULT 0.80,
  is_active boolean DEFAULT true,
  rollover_unused boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Receipts Table
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_business_id ON categories(business_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(business_id, type);
CREATE INDEX IF NOT EXISTS idx_budgets_business_id ON budgets(business_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(business_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(business_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_receipts_transaction_id ON receipts(transaction_id);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Categories Policies
CREATE POLICY "Users can view categories of their businesses or system categories"
  ON categories FOR SELECT
  TO authenticated
  USING (
    is_system = true OR
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = categories.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create categories for their businesses"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IS NULL OR
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = categories.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    is_system = false AND
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = categories.business_id
      AND businesses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = categories.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    is_system = false AND
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = categories.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Budgets Policies
CREATE POLICY "Users can view budgets of their businesses"
  ON budgets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = budgets.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create budgets for their businesses"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = budgets.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budgets of their businesses"
  ON budgets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = budgets.business_id
      AND businesses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = budgets.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budgets of their businesses"
  ON budgets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = budgets.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Receipts Policies
CREATE POLICY "Users can view receipts of their transactions"
  ON receipts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      JOIN businesses ON businesses.id = transactions.business_id
      WHERE transactions.id = receipts.transaction_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload receipts to their transactions"
  ON receipts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      JOIN businesses ON businesses.id = transactions.business_id
      WHERE transactions.id = receipts.transaction_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete receipts of their transactions"
  ON receipts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      JOIN businesses ON businesses.id = transactions.business_id
      WHERE transactions.id = receipts.transaction_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert system categories
INSERT INTO categories (business_id, name, type, icon, color, is_system) VALUES
  (NULL, 'Office & Admin', 'expense', 'Briefcase', '#4F7CFF', true),
  (NULL, 'Marketing', 'expense', 'TrendingUp', '#F59E0B', true),
  (NULL, 'Travel & Meals', 'expense', 'Plane', '#10B981', true),
  (NULL, 'Utilities', 'expense', 'Zap', '#8B5CF6', true),
  (NULL, 'Rent', 'expense', 'Home', '#EF4444', true),
  (NULL, 'Software', 'expense', 'Code', '#3B82F6', true),
  (NULL, 'Salary', 'expense', 'Users', '#6366F1', true),
  (NULL, 'Professional Services', 'expense', 'Award', '#EC4899', true),
  (NULL, 'Equipment', 'expense', 'Monitor', '#14B8A6', true),
  (NULL, 'Sales Revenue', 'income', 'DollarSign', '#10B981', true),
  (NULL, 'Service Income', 'income', 'Briefcase', '#3B82F6', true),
  (NULL, 'Investment Income', 'income', 'TrendingUp', '#8B5CF6', true),
  (NULL, 'Other Income', 'income', 'Plus', '#6366F1', true),
  (NULL, 'Other Expenses', 'expense', 'MoreHorizontal', '#6B7280', true)
ON CONFLICT DO NOTHING;
