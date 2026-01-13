-- Create expense_approvals table and RLS (idempotent)

CREATE TABLE IF NOT EXISTS public.expense_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  submitter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  approver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  approval_level int DEFAULT 1,
  total_levels int DEFAULT 1,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  comments text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.expense_approvals ENABLE ROW LEVEL SECURITY;

-- Policies aligned with business membership model
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


