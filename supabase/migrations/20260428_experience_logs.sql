-- Experience history table for XP gain/loss events

create table if not exists public.experience_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta_exp integer not null,
  balance_after integer,
  reason text not null default 'manual',
  source text not null default 'app',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint experience_logs_reason_not_empty check (char_length(trim(reason)) > 0)
);

create index if not exists idx_experience_logs_user_created_at
  on public.experience_logs(user_id, created_at desc);

create index if not exists idx_experience_logs_reason
  on public.experience_logs(reason);

alter table public.experience_logs enable row level security;

drop policy if exists "experience_logs_select_self_or_admin" on public.experience_logs;
create policy "experience_logs_select_self_or_admin"
on public.experience_logs
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

drop policy if exists "experience_logs_insert_self_or_admin" on public.experience_logs;
create policy "experience_logs_insert_self_or_admin"
on public.experience_logs
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

drop policy if exists "experience_logs_update_admin_only" on public.experience_logs;
create policy "experience_logs_update_admin_only"
on public.experience_logs
for update
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);

drop policy if exists "experience_logs_delete_admin_only" on public.experience_logs;
create policy "experience_logs_delete_admin_only"
on public.experience_logs
for delete
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  )
);
