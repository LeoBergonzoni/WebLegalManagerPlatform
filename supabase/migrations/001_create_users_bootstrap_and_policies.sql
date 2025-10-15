-- 1) Ensure table shape
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null,
  email text not null,
  name text,
  plan text default 'free',
  billing_status text default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone default now()
);

-- 2) RLS
alter table public.users enable row level security;

do $$
begin
  -- SELECT own row
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='users' and policyname='users_select_own'
  ) then
    create policy users_select_own on public.users
      for select using (auth.uid() = auth_user_id);
  end if;

  -- INSERT: allow only service role; for app runtime we bootstrap via trigger, so block direct inserts
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='users' and policyname='users_insert_service_only'
  ) then
    create policy users_insert_service_only on public.users
      for insert with check (false);
  end if;

  -- UPDATE own row
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='users' and policyname='users_update_own'
  ) then
    create policy users_update_own on public.users
      for update using (auth.uid() = auth_user_id);
  end if;
end
$$;

-- 3) Trigger: on auth.users insert -> ensure a row in public.users
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (auth_user_id, email, name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
