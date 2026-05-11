-- Hard reset group RLS to eliminate recursion definitively.
-- This migration drops ALL policies on group_members/group_messages/group_activities
-- and recreates non-recursive policies.

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;

do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_members'
  loop
    execute format('drop policy if exists %I on public.group_members', p.policyname);
  end loop;

  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_messages'
  loop
    execute format('drop policy if exists %I on public.group_messages', p.policyname);
  end loop;

  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_activities'
  loop
    execute format('drop policy if exists %I on public.group_activities', p.policyname);
  end loop;
end $$;

alter table if exists public.group_members enable row level security;
alter table if exists public.group_messages enable row level security;
alter table if exists public.group_activities enable row level security;

-- group_members: no self-reference, no recursion.
create policy "group_members_select_self_or_admin"
on public.group_members
for select
to authenticated
using (user_id = auth.uid() or public.is_admin_user());

create policy "group_members_insert_self_or_admin"
on public.group_members
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin_user());

create policy "group_members_update_self_or_admin"
on public.group_members
for update
to authenticated
using (user_id = auth.uid() or public.is_admin_user())
with check (user_id = auth.uid() or public.is_admin_user());

-- group_messages: membership check via group_members by user_id, not by policy recursion.
create policy "group_messages_select_member_or_admin"
on public.group_messages
for select
to authenticated
using (
  public.is_admin_user()
  or exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_messages.group_id
      and gm.user_id = auth.uid()
  )
);

create policy "group_messages_insert_member_or_admin"
on public.group_messages
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    public.is_admin_user()
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_messages.group_id
        and gm.user_id = auth.uid()
    )
  )
);

-- group_activities
create policy "group_activities_select_member_or_admin"
on public.group_activities
for select
to authenticated
using (
  public.is_admin_user()
  or exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_activities.group_id
      and gm.user_id = auth.uid()
  )
);

create policy "group_activities_insert_member_or_admin"
on public.group_activities
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.is_admin_user()
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_activities.group_id
        and gm.user_id = auth.uid()
    )
  )
);

create policy "group_activities_update_member_or_admin"
on public.group_activities
for update
to authenticated
using (
  public.is_admin_user()
  or exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_activities.group_id
      and gm.user_id = auth.uid()
  )
)
with check (
  public.is_admin_user()
  or exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_activities.group_id
      and gm.user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
