-- Clients table for invoice management
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address jsonb DEFAULT '{}'::jsonb,
  contact_person text,
  tax_id text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add client_id to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);

-- RLS policies for clients
CREATE POLICY "Users can view clients of their businesses"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = clients.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage clients of their businesses"
  ON clients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = clients.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE INDEX idx_clients_business_id ON clients(business_id);






