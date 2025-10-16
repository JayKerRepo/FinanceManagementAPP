/*
  # Comprehensive Features Schema - Invoicing, P&L, Approvals, Mileage, Notifications, Subscriptions

  ## New Tables

  ### 1. Invoices Table
    - `id` (uuid, primary key)
    - `business_id` (uuid, foreign key)
    - `invoice_number` (text, unique) - Auto-generated invoice number
    - `client_name` (text) - Client/customer name
    - `client_email` (text) - Client email
    - `client_address` (jsonb) - Client address details
    - `status` (text) - draft, sent, paid, overdue, cancelled
    - `issue_date` (date) - Invoice issue date
    - `due_date` (date) - Payment due date
    - `subtotal` (numeric) - Subtotal before tax
    - `tax_rate` (numeric) - Tax percentage
    - `tax_amount` (numeric) - Calculated tax amount
    - `discount` (numeric) - Discount amount
    - `total_amount` (numeric) - Final total amount
    - `paid_amount` (numeric) - Amount paid so far
    - `currency` (text) - Currency code
    - `line_items` (jsonb) - Array of line items
    - `notes` (text) - Notes for client
    - `terms` (text) - Payment terms
    - `is_recurring` (boolean) - Recurring invoice flag
    - `recurring_config` (jsonb) - Recurrence configuration
    - `template_id` (uuid) - Invoice template reference
    - `created_at`, `updated_at` (timestamptz)

  ### 2. Invoice Payments Table
    - `id` (uuid, primary key)
    - `invoice_id` (uuid, foreign key)
    - `payment_date` (date) - Payment received date
    - `amount` (numeric) - Payment amount
    - `payment_method` (text) - Payment method used
    - `reference` (text) - Payment reference/transaction ID
    - `notes` (text) - Payment notes
    - `created_at` (timestamptz)

  ### 3. Expense Approvals Table
    - `id` (uuid, primary key)
    - `business_id` (uuid, foreign key)
    - `transaction_id` (uuid, foreign key)
    - `submitter_id` (uuid, foreign key) - User who submitted
    - `approver_id` (uuid, foreign key) - User who should approve
    - `status` (text) - pending, approved, rejected, cancelled
    - `approval_level` (int) - Current approval level
    - `total_levels` (int) - Total approval levels required
    - `submitted_at` (timestamptz) - Submission timestamp
    - `reviewed_at` (timestamptz) - Review timestamp
    - `comments` (text) - Approver comments
    - `metadata` (jsonb) - Additional data
    - `created_at`, `updated_at` (timestamptz)

  ### 4. Approval Workflows Table
    - `id` (uuid, primary key)
    - `business_id` (uuid, foreign key)
    - `name` (text) - Workflow name
    - `is_active` (boolean) - Active status
    - `threshold_amount` (numeric) - Amount threshold for this workflow
    - `approval_levels` (jsonb) - Array of approval levels with approvers
    - `applies_to` (text[]) - Categories this applies to
    - `created_at`, `updated_at` (timestamptz)

  ### 5. Mileage Logs Table
    - `id` (uuid, primary key)
    - `business_id` (uuid, foreign key)
    - `user_id` (uuid, foreign key)
    - `date` (date) - Travel date
    - `start_location` (text) - Starting location
    - `end_location` (text) - Ending location
    - `distance_miles` (numeric) - Distance in miles
    - `distance_km` (numeric) - Distance in kilometers
    - `rate_per_mile` (numeric) - Reimbursement rate per mile
    - `total_amount` (numeric) - Calculated reimbursement
    - `purpose` (text) - Purpose of trip
    - `vehicle` (text) - Vehicle used
    - `is_round_trip` (boolean) - Round trip flag
    - `gps_data` (jsonb) - GPS coordinates if tracked
    - `receipt_url` (text) - Receipt/proof attachment
    - `status` (text) - draft, submitted, approved, reimbursed
    - `created_at`, `updated_at` (timestamptz)

  ### 6. Notifications Table
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key)
    - `business_id` (uuid, foreign key)
    - `type` (text) - approval_pending, invoice_overdue, budget_alert, etc.
    - `title` (text) - Notification title
    - `message` (text) - Notification message
    - `link` (text) - Deep link to related resource
    - `is_read` (boolean) - Read status
    - `priority` (text) - low, normal, high, urgent
    - `metadata` (jsonb) - Additional data
    - `created_at` (timestamptz)

  ### 7. User Roles Table
    - `id` (uuid, primary key)
    - `business_id` (uuid, foreign key)
    - `user_id` (uuid, foreign key)
    - `role` (text) - owner, admin, manager, accountant, employee, viewer
    - `permissions` (jsonb) - Granular permissions
    - `can_approve_expenses` (boolean)
    - `approval_limit` (numeric) - Maximum amount they can approve
    - `created_at`, `updated_at` (timestamptz)

  ### 8. Subscriptions Table
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key)
    - `plan` (text) - free, starter, professional, enterprise
    - `status` (text) - active, cancelled, past_due, trialing
    - `billing_cycle` (text) - monthly, yearly
    - `price` (numeric) - Subscription price
    - `currency` (text) - Currency code
    - `stripe_customer_id` (text) - Stripe customer ID
    - `stripe_subscription_id` (text) - Stripe subscription ID
    - `current_period_start` (timestamptz)
    - `current_period_end` (timestamptz)
    - `trial_end` (timestamptz)
    - `cancelled_at` (timestamptz)
    - `features` (jsonb) - Plan features
    - `created_at`, `updated_at` (timestamptz)

  ### 9. Payment Methods Table
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key)
    - `stripe_payment_method_id` (text) - Stripe PM ID
    - `type` (text) - card, bank_account
    - `brand` (text) - visa, mastercard, etc.
    - `last4` (text) - Last 4 digits
    - `exp_month` (int) - Expiration month
    - `exp_year` (int) - Expiration year
    - `is_default` (boolean) - Default payment method
    - `created_at` (timestamptz)

  ## Security
    - RLS enabled on all tables
    - Appropriate policies for each table
*/

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  client_name text NOT NULL,
  client_email text,
  client_address jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  subtotal numeric(15, 2) NOT NULL DEFAULT 0,
  tax_rate numeric(5, 2) DEFAULT 0,
  tax_amount numeric(15, 2) DEFAULT 0,
  discount numeric(15, 2) DEFAULT 0,
  total_amount numeric(15, 2) NOT NULL,
  paid_amount numeric(15, 2) DEFAULT 0,
  currency text DEFAULT 'USD',
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  terms text,
  is_recurring boolean DEFAULT false,
  recurring_config jsonb DEFAULT NULL,
  template_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoice Payments Table
CREATE TABLE IF NOT EXISTS invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(15, 2) NOT NULL,
  payment_method text NOT NULL,
  reference text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Expense Approvals Table
CREATE TABLE IF NOT EXISTS expense_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  submitter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  approver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approval_level int DEFAULT 1,
  total_levels int DEFAULT 1,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  comments text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Approval Workflows Table
CREATE TABLE IF NOT EXISTS approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  threshold_amount numeric(15, 2) DEFAULT 0,
  approval_levels jsonb NOT NULL DEFAULT '[]'::jsonb,
  applies_to text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mileage Logs Table
CREATE TABLE IF NOT EXISTS mileage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  start_location text NOT NULL,
  end_location text NOT NULL,
  distance_miles numeric(10, 2) NOT NULL,
  distance_km numeric(10, 2) NOT NULL,
  rate_per_mile numeric(5, 2) NOT NULL,
  total_amount numeric(15, 2) NOT NULL,
  purpose text NOT NULL,
  vehicle text,
  is_round_trip boolean DEFAULT false,
  gps_data jsonb DEFAULT NULL,
  receipt_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'reimbursed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'accountant', 'employee', 'viewer')),
  permissions jsonb DEFAULT '{}'::jsonb,
  can_approve_expenses boolean DEFAULT false,
  approval_limit numeric(15, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete')),
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  price numeric(10, 2) DEFAULT 0,
  currency text DEFAULT 'USD',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  cancelled_at timestamptz,
  features jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('card', 'bank_account')),
  brand text,
  last4 text NOT NULL,
  exp_month int,
  exp_year int,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(business_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE status NOT IN ('paid', 'cancelled');
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_business_id ON expense_approvals(business_id);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_approver ON expense_approvals(approver_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_expense_approvals_submitter ON expense_approvals(submitter_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_business_id ON approval_workflows(business_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_business_id ON mileage_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_user_id ON mileage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_date ON mileage_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_user_roles_business_id ON user_roles(business_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Invoices Policies
CREATE POLICY "Users can view invoices of their businesses"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = invoices.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create invoices for their businesses"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = invoices.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invoices of their businesses"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = invoices.business_id
      AND businesses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = invoices.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete invoices of their businesses"
  ON invoices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = invoices.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Invoice Payments Policies
CREATE POLICY "Users can view payments of their invoices"
  ON invoice_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN businesses ON businesses.id = invoices.business_id
      WHERE invoices.id = invoice_payments.invoice_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add payments to their invoices"
  ON invoice_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN businesses ON businesses.id = invoices.business_id
      WHERE invoices.id = invoice_payments.invoice_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Expense Approvals Policies
CREATE POLICY "Users can view approvals for their businesses"
  ON expense_approvals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = expense_approvals.business_id
      AND businesses.user_id = auth.uid()
    )
    OR approver_id = auth.uid()
    OR submitter_id = auth.uid()
  );

CREATE POLICY "Users can create approvals for their businesses"
  ON expense_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = expense_approvals.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Approvers can update their assigned approvals"
  ON expense_approvals FOR UPDATE
  TO authenticated
  USING (approver_id = auth.uid())
  WITH CHECK (approver_id = auth.uid());

-- Approval Workflows Policies
CREATE POLICY "Users can view workflows of their businesses"
  ON approval_workflows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = approval_workflows.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage workflows of their businesses"
  ON approval_workflows FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = approval_workflows.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Mileage Logs Policies
CREATE POLICY "Users can view mileage logs of their businesses"
  ON mileage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = mileage_logs.business_id
      AND businesses.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can create mileage logs for their businesses"
  ON mileage_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = mileage_logs.business_id
      AND businesses.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own mileage logs"
  ON mileage_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own mileage logs"
  ON mileage_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications for users"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- User Roles Policies
CREATE POLICY "Users can view roles in their businesses"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = user_roles.business_id
      AND businesses.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Business owners can manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = user_roles.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Subscriptions Policies
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own subscription"
  ON subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Payment Methods Policies
CREATE POLICY "Users can view their own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_approvals_updated_at
  BEFORE UPDATE ON expense_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at
  BEFORE UPDATE ON approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mileage_logs_updated_at
  BEFORE UPDATE ON mileage_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
DECLARE
  new_number text;
  year_month text;
  sequence_num int;
BEGIN
  year_month := to_char(CURRENT_DATE, 'YYYYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || year_month || '%';
  
  new_number := 'INV-' || year_month || '-' || LPAD(sequence_num::text, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total numeric;
  v_paid numeric;
BEGIN
  SELECT total_amount, COALESCE(SUM(ip.amount), 0)
  INTO v_total, v_paid
  FROM invoices i
  LEFT JOIN invoice_payments ip ON ip.invoice_id = i.id
  WHERE i.id = NEW.invoice_id
  GROUP BY i.id, i.total_amount;
  
  UPDATE invoices
  SET 
    paid_amount = v_paid,
    status = CASE
      WHEN v_paid >= v_total THEN 'paid'
      WHEN v_paid > 0 THEN 'partial'
      WHEN due_date < CURRENT_DATE AND status NOT IN ('paid', 'cancelled') THEN 'overdue'
      ELSE status
    END
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice status on payment
CREATE TRIGGER update_invoice_status_trigger
  AFTER INSERT OR UPDATE ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status();

-- Function to create notification for expense approval
CREATE OR REPLACE FUNCTION notify_expense_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status)) AND NEW.status = 'pending' AND NEW.approver_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, business_id, type, title, message, link, priority)
    VALUES (
      NEW.approver_id,
      NEW.business_id,
      'approval_pending',
      'Expense Approval Required',
      'A new expense requires your approval',
      '/app/approvals/' || NEW.id,
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for approval notifications
CREATE TRIGGER notify_expense_approval_trigger
  AFTER INSERT OR UPDATE ON expense_approvals
  FOR EACH ROW
  EXECUTE FUNCTION notify_expense_approval();