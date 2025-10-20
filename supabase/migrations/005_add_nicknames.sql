create table if not exists public.nicknames (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  nickname text not null,
  position smallint not null check (position >= 0 and position < 4),
  created_at timestamp with time zone default now()
);

create unique index if not exists nicknames_user_position_key on public.nicknames (user_id, position);

alter table public.nicknames enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nicknames'
      and policyname = 'nicknames_select_own'
  ) then
    create policy nicknames_select_own on public.nicknames
      for select
      using (
        exists (
          select 1
          from public.users u
          where u.id = nicknames.user_id
            and u.auth_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nicknames'
      and policyname = 'nicknames_modify_own'
  ) then
    create policy nicknames_modify_own on public.nicknames
      for all
      using (
        exists (
          select 1
          from public.users u
          where u.id = nicknames.user_id
            and u.auth_user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.users u
          where u.id = nicknames.user_id
            and u.auth_user_id = auth.uid()
        )
      );
  end if;
end
$$;
