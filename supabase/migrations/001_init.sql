-- users (app-level profile; separate from Supabase auth.users)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null, -- maps to auth.users.id
  email text not null,
  name text,
  plan text default 'free',
  billing_status text,
  created_at timestamp with time zone default now()
);

create table if not exists public.identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  doc_type text,
  doc_url text,
  verified_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.mandates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  signed_pdf_url text,
  signed_at timestamptz,
  valid_until timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  url text not null,
  source_type text, -- search/host/social
  evidence jsonb,   -- thumbs/meta
  status text default 'Found',
  created_at timestamptz default now()
);

create table if not exists public.takedowns (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid references public.findings(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  channel text, -- search_form/email/host_form
  submitted_at timestamptz,
  result text,  -- delisted/removed/refused
  proof_url text,
  created_at timestamptz default now()
);

alter table public.users enable row level security;
alter table public.identities enable row level security;
alter table public.mandates enable row level security;
alter table public.findings enable row level security;
alter table public.takedowns enable row level security;

-- Policies: each user can see/modify only their own rows
create policy "users_self" on public.users
  for all using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

create policy "identities_by_user" on public.identities
  for all using (exists(select 1 from public.users u where u.id = identities.user_id and u.auth_user_id = auth.uid()))
  with check (exists(select 1 from public.users u where u.id = identities.user_id and u.auth_user_id = auth.uid()));

create policy "mandates_by_user" on public.mandates
  for all using (exists(select 1 from public.users u where u.id = mandates.user_id and u.auth_user_id = auth.uid()))
  with check (exists(select 1 from public.users u where u.id = mandates.user_id and u.auth_user_id = auth.uid()));

create policy "findings_by_user" on public.findings
  for all using (exists(select 1 from public.users u where u.id = findings.user_id and u.auth_user_id = auth.uid()))
  with check (exists(select 1 from public.users u where u.id = findings.user_id and u.auth_user_id = auth.uid()));

create policy "takedowns_by_user" on public.takedowns
  for all using (exists(select 1 from public.users u where u.id = takedowns.user_id and u.auth_user_id = auth.uid()))
  with check (exists(select 1 from public.users u where u.id = takedowns.user_id and u.auth_user_id = auth.uid()));
