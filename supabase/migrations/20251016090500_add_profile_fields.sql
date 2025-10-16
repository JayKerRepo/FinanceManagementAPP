-- Profiles table enhancements: add display_name, phone_verified, is_admin, indexes, RLS safety

-- Add missing columns (idempotent)
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists phone_verified boolean default false,
  add column if not exists is_admin boolean default false;

-- Indexes for fast lookups
create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_profiles_phone on public.profiles (phone);

-- Ensure RLS is enabled
alter table public.profiles enable row level security;

-- Self-only policies (drop if exist to avoid duplicates, then create)
drop policy if exists "Profiles select own" on public.profiles;
create policy "Profiles select own"
on public.profiles for select to authenticated
using (auth.uid() = id);

drop policy if exists "Profiles update own" on public.profiles;
create policy "Profiles update own"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- updated_at maintenance trigger (create function if not exists via replace, then recreate trigger)
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();




