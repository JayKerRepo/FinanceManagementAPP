-- Businesses core schema: tables, RLS, creator-as-owner trigger

create extension if not exists "pgcrypto";

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type text default 'Other',
  tax_id text,
  address jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','admin','manager','accountant','employee','viewer')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists idx_businesses_name on public.businesses(name);
create index if not exists idx_business_members_business on public.business_members(business_id);
create index if not exists idx_business_members_user on public.business_members(user_id);

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;

create or replace view public.v_my_businesses as
select bm.business_id from public.business_members bm where bm.user_id = auth.uid();

drop policy if exists "Members read businesses" on public.businesses;
create policy "Members read businesses"
on public.businesses for select to authenticated
using (exists (select 1 from public.v_my_businesses v where v.business_id = businesses.id));

-- Split manage into update/delete policies (Postgres doesn't support multiple commands per policy)
drop policy if exists "Members update businesses" on public.businesses;
create policy "Members update businesses"
on public.businesses
for update
to authenticated
using (exists (select 1 from public.v_my_businesses v where v.business_id = businesses.id))
with check (exists (select 1 from public.v_my_businesses v where v.business_id = businesses.id));

drop policy if exists "Members delete businesses" on public.businesses;
create policy "Members delete businesses"
on public.businesses
for delete
to authenticated
using (exists (select 1 from public.v_my_businesses v where v.business_id = businesses.id));

drop policy if exists "Anyone can create business (becomes owner)" on public.businesses;
create policy "Anyone can create business (becomes owner)"
on public.businesses for insert to authenticated
with check (true);

drop policy if exists "Members read membership" on public.business_members;
create policy "Members read membership"
on public.business_members for select to authenticated
using (exists (select 1 from public.v_my_businesses v where v.business_id = business_members.business_id));

-- Split owners manage membership into insert/update/delete
drop policy if exists "Owners insert membership" on public.business_members;
create policy "Owners insert membership"
on public.business_members
for insert
to authenticated
with check (exists (
  select 1 from public.business_members bm2
  where bm2.business_id = business_members.business_id
    and bm2.user_id = auth.uid()
    and bm2.role = 'owner'
));

drop policy if exists "Owners update membership" on public.business_members;
create policy "Owners update membership"
on public.business_members
for update
to authenticated
using (exists (
  select 1 from public.business_members bm2
  where bm2.business_id = business_members.business_id
    and bm2.user_id = auth.uid()
    and bm2.role = 'owner'
))
with check (exists (
  select 1 from public.business_members bm2
  where bm2.business_id = business_members.business_id
    and bm2.user_id = auth.uid()
    and bm2.role = 'owner'
));

drop policy if exists "Owners delete membership" on public.business_members;
create policy "Owners delete membership"
on public.business_members
for delete
to authenticated
using (exists (
  select 1 from public.business_members bm2
  where bm2.business_id = business_members.business_id
    and bm2.user_id = auth.uid()
    and bm2.role = 'owner'
));

create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists update_businesses_updated_at on public.businesses;
create trigger update_businesses_updated_at
before update on public.businesses
for each row execute function public.update_updated_at_column();

create or replace function public.add_creator_as_owner()
returns trigger language plpgsql security definer as $$
begin
  insert into public.business_members (business_id, user_id, role)
  values (new.id, auth.uid(), 'owner')
  on conflict (business_id, user_id) do nothing;
  return new;
end $$;

drop trigger if exists business_creator_owner on public.businesses;
create trigger business_creator_owner
after insert on public.businesses
for each row execute function public.add_creator_as_owner();



