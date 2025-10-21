-- Allow admin profiles (public.users.is_admin = true) to manage workspace data

drop policy if exists "users_admin_access" on public.users;
create policy "users_admin_access" on public.users
  for all using (
    exists (
      select 1
      from public.users admins
      where admins.auth_user_id = auth.uid()
        and admins.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.users admins
      where admins.auth_user_id = auth.uid()
        and admins.is_admin = true
    )
  );

drop policy if exists "findings_admin_access" on public.findings;
create policy "findings_admin_access" on public.findings
  for all using (
    exists (
      select 1
      from public.users admins
      where admins.auth_user_id = auth.uid()
        and admins.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.users admins
      where admins.auth_user_id = auth.uid()
        and admins.is_admin = true
    )
  );

drop policy if exists "takedowns_admin_access" on public.takedowns;
create policy "takedowns_admin_access" on public.takedowns
  for all using (
    exists (
      select 1
      from public.users admins
      where admins.auth_user_id = auth.uid()
        and admins.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.users admins
      where admins.auth_user_id = auth.uid()
        and admins.is_admin = true
    )
  );
