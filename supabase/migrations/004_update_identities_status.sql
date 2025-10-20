alter table public.identities
  add column if not exists doc_type text;

alter table public.identities
  add column if not exists status text default 'submitted';

comment on column public.identities.status is 'Submission status: submitted, approved, rejected.';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'identities'
      and column_name = 'verified_at'
  ) then
    update public.identities as i
    set status = case
      when i.status is not null then i.status
      when i.verified_at is not null then 'approved'
      else 'submitted'
    end;
  else
    update public.identities
    set status = coalesce(status, 'submitted');
  end if;
end;
$$;
