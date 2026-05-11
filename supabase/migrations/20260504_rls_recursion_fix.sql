-- Fix recursive RLS on public.users.
-- Root cause: users policies queried public.users inside policy expressions.

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

-- Users policies (critical recursion fix)
drop policy if exists "users_select_self_or_admin" on public.users;
create policy "users_select_self_or_admin"
on public.users
for select
to authenticated
using (auth.uid() = id or public.is_admin_user());

drop policy if exists "users_update_self_or_admin" on public.users;
create policy "users_update_self_or_admin"
on public.users
for update
to authenticated
using (auth.uid() = id or public.is_admin_user())
with check (auth.uid() = id or public.is_admin_user());

drop policy if exists "users_insert_self_or_admin" on public.users;
create policy "users_insert_self_or_admin"
on public.users
for insert
to authenticated
with check (auth.uid() = id or public.is_admin_user());

-- Related policies rewritten to avoid users-subquery chains.
drop policy if exists "experience_logs_select_self_or_admin" on public.experience_logs;
create policy "experience_logs_select_self_or_admin"
on public.experience_logs
for select
to authenticated
using (user_id = auth.uid() or public.is_admin_user());

drop policy if exists "experience_logs_insert_self_or_admin" on public.experience_logs;
create policy "experience_logs_insert_self_or_admin"
on public.experience_logs
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin_user());

drop policy if exists "experience_logs_update_admin_only" on public.experience_logs;
create policy "experience_logs_update_admin_only"
on public.experience_logs
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "experience_logs_delete_admin_only" on public.experience_logs;
create policy "experience_logs_delete_admin_only"
on public.experience_logs
for delete
to authenticated
using (public.is_admin_user());

drop policy if exists "checkins_select_self" on public.user_checkins;
create policy "checkins_select_self"
on public.user_checkins
for select
to authenticated
using (user_id = auth.uid() or public.is_admin_user());

drop policy if exists "checkins_insert_self" on public.user_checkins;
create policy "checkins_insert_self"
on public.user_checkins
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin_user());

drop policy if exists "task_claims_select_self" on public.user_task_claims;
create policy "task_claims_select_self"
on public.user_task_claims
for select
to authenticated
using (user_id = auth.uid() or public.is_admin_user());

drop policy if exists "task_claims_insert_self" on public.user_task_claims;
create policy "task_claims_insert_self"
on public.user_task_claims
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin_user());

drop policy if exists "group_members_select_group_member_or_admin" on public.group_members;
create policy "group_members_select_group_member_or_admin"
on public.group_members
for select
to authenticated
using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
  )
  or public.is_admin_user()
);

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
using (
  public.is_admin_user()
  or exists (
    select 1
    from public.group_members leader
    where leader.group_id = group_members.group_id
      and leader.user_id = auth.uid()
      and leader.role = 'leader'
  )
)
with check (
  public.is_admin_user()
  or exists (
    select 1
    from public.group_members leader
    where leader.group_id = group_members.group_id
      and leader.user_id = auth.uid()
      and leader.role = 'leader'
  )
);

drop policy if exists "group_messages_select_member_or_admin" on public.group_messages;
create policy "group_messages_select_member_or_admin"
on public.group_messages
for select
to authenticated
using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = group_messages.group_id
      and gm.user_id = auth.uid()
  )
  or public.is_admin_user()
);

drop policy if exists "group_messages_insert_member_or_admin" on public.group_messages;
create policy "group_messages_insert_member_or_admin"
on public.group_messages
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_messages.group_id
        and gm.user_id = auth.uid()
    )
    or public.is_admin_user()
  )
);

drop policy if exists "group_activities_select_member_or_admin" on public.group_activities;
create policy "group_activities_select_member_or_admin"
on public.group_activities
for select
to authenticated
using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = group_activities.group_id
      and gm.user_id = auth.uid()
  )
  or public.is_admin_user()
);

drop policy if exists "group_activities_insert_leader_or_admin" on public.group_activities;
create policy "group_activities_insert_leader_or_admin"
on public.group_activities
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_activities.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'leader'
    )
    or public.is_admin_user()
  )
);

drop policy if exists "group_activities_update_leader_or_admin" on public.group_activities;
create policy "group_activities_update_leader_or_admin"
on public.group_activities
for update
to authenticated
using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = group_activities.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'leader'
  )
  or public.is_admin_user()
)
with check (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = group_activities.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'leader'
  )
  or public.is_admin_user()
);

drop policy if exists "event_participants_select_self_or_admin" on public.event_participants;
create policy "event_participants_select_self_or_admin"
on public.event_participants
for select
to authenticated
using (user_id = auth.uid() or public.is_admin_user());

drop policy if exists "event_participants_insert_self_or_admin" on public.event_participants;
create policy "event_participants_insert_self_or_admin"
on public.event_participants
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin_user());

notify pgrst, 'reload schema';
