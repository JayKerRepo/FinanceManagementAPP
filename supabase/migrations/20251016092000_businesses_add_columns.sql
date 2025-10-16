-- Add missing optional columns to businesses to match UI expectations

alter table public.businesses
  add column if not exists tax_id text,
  add column if not exists address jsonb default '{}'::jsonb;

-- Ensure RLS remains enabled (no-op if already enabled)
alter table public.businesses enable row level security;


