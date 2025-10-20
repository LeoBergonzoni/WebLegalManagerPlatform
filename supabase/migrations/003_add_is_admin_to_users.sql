alter table public.users
  add column if not exists is_admin boolean not null default false;

comment on column public.users.is_admin is 'Marks whether the user can access admin features.';
