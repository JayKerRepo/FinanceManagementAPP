-- Permit insert of businesses by any authenticated user
alter table public.businesses enable row level security;

drop policy if exists "insert_business_any_authenticated" on public.businesses;
create policy "insert_business_any_authenticated"
on public.businesses
for insert
to authenticated
with check (auth.uid() is not null);

-- Ensure creator-as-owner trigger exists (idempotent)
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


