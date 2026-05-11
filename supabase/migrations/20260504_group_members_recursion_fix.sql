-- Hard fix for infinite recursion on group_members RLS.
-- Root cause: policies on group_members referenced group_members directly.

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_leader(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
      and gm.role = 'leader'
  );
$$;

revoke all on function public.is_group_member(uuid) from public;
revoke all on function public.is_group_leader(uuid) from public;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_leader(uuid) to authenticated;

-- group_members
drop policy if exists "group_members_select_group_member_or_admin" on public.group_members;
create policy "group_members_select_group_member_or_admin"
on public.group_members
for select
to authenticated
using (public.is_group_member(group_id) or public.is_admin_user());

drop policy if exists "group_members_insert_self_or_admin" on public.group_members;
create policy "group_members_insert_self_or_admin"
on public.group_members
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin_user());

drop policy if exists "group_members_update_admin_or_leader" on public.group_members;
create policy "group_members_update_admin_or_leader"
on public.group_members
for update
to authenticated
using (public.is_group_leader(group_id) or public.is_admin_user())
with check (public.is_group_leader(group_id) or public.is_admin_user());

-- group_messages
drop policy if exists "group_messages_select_member_or_admin" on public.group_messages;
create policy "group_messages_select_member_or_admin"
on public.group_messages
for select
to authenticated
using (public.is_group_member(group_id) or public.is_admin_user());

drop policy if exists "group_messages_insert_member_or_admin" on public.group_messages;
create policy "group_messages_insert_member_or_admin"
on public.group_messages
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (public.is_group_member(group_id) or public.is_admin_user())
);

-- group_activities
drop policy if exists "group_activities_select_member_or_admin" on public.group_activities;
create policy "group_activities_select_member_or_admin"
on public.group_activities
for select
to authenticated
using (public.is_group_member(group_id) or public.is_admin_user());

drop policy if exists "group_activities_insert_leader_or_admin" on public.group_activities;
create policy "group_activities_insert_leader_or_admin"
on public.group_activities
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (public.is_group_leader(group_id) or public.is_admin_user())
);

drop policy if exists "group_activities_update_leader_or_admin" on public.group_activities;
create policy "group_activities_update_leader_or_admin"
on public.group_activities
for update
to authenticated
using (public.is_group_leader(group_id) or public.is_admin_user())
with check (public.is_group_leader(group_id) or public.is_admin_user());

notify pgrst, 'reload schema';
