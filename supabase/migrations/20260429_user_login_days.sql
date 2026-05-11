-- Track total login days for authenticated users.
alter table public.users
  add column if not exists login_days integer not null default 0,
  add column if not exists last_login_date date;

update public.users
set login_days = coalesce(login_days, 0)
where login_days is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_login_days_nonnegative'
  ) then
    alter table public.users
      add constraint users_login_days_nonnegative check (login_days >= 0);
  end if;
end $$;

notify pgrst, 'reload schema';
