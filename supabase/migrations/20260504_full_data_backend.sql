-- Full app data wiring: check-ins, tasks, groups, messages, activities, event participation.
create extension if not exists "pgcrypto";

-- ---- Content extensions (existing tables) ----
alter table if exists public.courses
  add column if not exists title_zh text default '',
  add column if not exists type text default 'Персональный',
  add column if not exists cover_url text default '',
  add column if not exists banner_label text default '',
  add column if not exists cta_label text default '',
  add column if not exists progress_percent integer not null default 0;

alter table if exists public.events
  add column if not exists rewards text[] not null default '{}',
  add column if not exists link text default '',
  add column if not exists weekly_prize numeric(10,2) not null default 0;

-- ---- User check-ins ----
create table if not exists public.user_checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  source text not null default 'web',
  created_at timestamptz not null default now(),
  primary key (user_id, checkin_date)
);

create index if not exists idx_user_checkins_user_date on public.user_checkins(user_id, checkin_date desc);

-- ---- Tasks & claims ----
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  points integer not null default 10 check (points > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_task_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  claimed_for_date date not null default ((now() at time zone 'Europe/Moscow')::date),
  points_awarded integer not null default 0 check (points_awarded >= 0),
  created_at timestamptz not null default now(),
  constraint user_task_claims_unique_per_day unique (user_id, task_id, claimed_for_date)
);

create index if not exists idx_user_task_claims_user_date on public.user_task_claims(user_id, claimed_for_date desc);

-- ---- Groups ----
create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  capacity integer not null default 6 check (capacity between 2 and 12),
  status text not null default 'open',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  constraint group_members_unique_user_group unique (group_id, user_id),
  constraint group_members_role_check check (role in ('leader', 'member'))
);

create index if not exists idx_group_members_user on public.group_members(user_id);
create index if not exists idx_group_members_group on public.group_members(group_id);

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message_text text not null check (char_length(trim(message_text)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_group_messages_group_created on public.group_messages(group_id, created_at desc);

create table if not exists public.group_activities (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  title text not null,
  details text not null default '',
  is_pinned boolean not null default false,
  scheduled_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_group_activities_group on public.group_activities(group_id, created_at desc);

-- ---- Event participation ----
create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  score integer not null default 0,
  constraint event_participants_unique unique (event_id, user_id)
);

create index if not exists idx_event_participants_event on public.event_participants(event_id, score desc);
create index if not exists idx_event_participants_user on public.event_participants(user_id);

-- ---- View for leaderboard ----
create or replace view public.weekly_rankings as
select
  u.id as user_id,
  coalesce(u.username, split_part(u.email, '@', 1), 'Игрок') as username,
  coalesce(u.exp, 0) as points,
  coalesce(u.level, 1) as level,
  row_number() over (order by coalesce(u.exp, 0) desc, u.created_at asc) as rank
from public.users u
where coalesce(u.status, 'active') <> 'blocked';

-- ---- RLS ----
alter table public.user_checkins enable row level security;
alter table public.tasks enable row level security;
alter table public.user_task_claims enable row level security;
alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
alter table public.group_activities enable row level security;
alter table public.event_participants enable row level security;

-- Content read policies for app users
drop policy if exists "courses_read_public" on public.courses;
create policy "courses_read_public"
on public.courses
for select
to anon, authenticated
using (status in ('published', 'active'));

drop policy if exists "events_read_public" on public.events;
create policy "events_read_public"
on public.events
for select
to anon, authenticated
using (status in ('Активные', 'active', 'published'));

-- Tasks read and claims
drop policy if exists "tasks_read_active" on public.tasks;
create policy "tasks_read_active"
on public.tasks
for select
to authenticated
using (is_active = true);

drop policy if exists "task_claims_select_self" on public.user_task_claims;
create policy "task_claims_select_self"
on public.user_task_claims
for select
to authenticated
using (user_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "task_claims_insert_self" on public.user_task_claims;
create policy "task_claims_insert_self"
on public.user_task_claims
for insert
to authenticated
with check (user_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- Check-ins
drop policy if exists "checkins_select_self" on public.user_checkins;
create policy "checkins_select_self"
on public.user_checkins
for select
to authenticated
using (user_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "checkins_insert_self" on public.user_checkins;
create policy "checkins_insert_self"
on public.user_checkins
for insert
to authenticated
with check (user_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- Groups: authenticated can see groups, membership-based detail access.
drop policy if exists "study_groups_select_auth" on public.study_groups;
create policy "study_groups_select_auth"
on public.study_groups
for select
to authenticated
using (true);

drop policy if exists "study_groups_insert_admin_or_authenticated" on public.study_groups;
create policy "study_groups_insert_admin_or_authenticated"
on public.study_groups
for insert
to authenticated
with check (created_by = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "study_groups_update_admin" on public.study_groups;
create policy "study_groups_update_admin"
on public.study_groups
for update
to authenticated
using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "group_members_select_group_member_or_admin" on public.group_members;
create policy "group_members_select_group_member_or_admin"
on public.group_members
for select
to authenticated
using (
  exists (select 1 from public.group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid())
  or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

drop policy if exists "group_members_insert_self_or_admin" on public.group_members;
create policy "group_members_insert_self_or_admin"
on public.group_members
for insert
to authenticated
with check (user_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "group_members_update_admin_or_leader" on public.group_members;
create policy "group_members_update_admin_or_leader"
on public.group_members
for update
to authenticated
using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  or exists (
    select 1 from public.group_members leader
    where leader.group_id = group_members.group_id and leader.user_id = auth.uid() and leader.role = 'leader'
  )
)
with check (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  or exists (
    select 1 from public.group_members leader
    where leader.group_id = group_members.group_id and leader.user_id = auth.uid() and leader.role = 'leader'
  )
);

drop policy if exists "group_messages_select_member_or_admin" on public.group_messages;
create policy "group_messages_select_member_or_admin"
on public.group_messages
for select
to authenticated
using (
  exists (select 1 from public.group_members gm where gm.group_id = group_messages.group_id and gm.user_id = auth.uid())
  or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

drop policy if exists "group_messages_insert_member_or_admin" on public.group_messages;
create policy "group_messages_insert_member_or_admin"
on public.group_messages
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    exists (select 1 from public.group_members gm where gm.group_id = group_messages.group_id and gm.user_id = auth.uid())
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  )
);

drop policy if exists "group_activities_select_member_or_admin" on public.group_activities;
create policy "group_activities_select_member_or_admin"
on public.group_activities
for select
to authenticated
using (
  exists (select 1 from public.group_members gm where gm.group_id = group_activities.group_id and gm.user_id = auth.uid())
  or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
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
      where gm.group_id = group_activities.group_id and gm.user_id = auth.uid() and gm.role = 'leader'
    )
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
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
    where gm.group_id = group_activities.group_id and gm.user_id = auth.uid() and gm.role = 'leader'
  )
  or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
)
with check (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = group_activities.group_id and gm.user_id = auth.uid() and gm.role = 'leader'
  )
  or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

-- Event participants
drop policy if exists "event_participants_select_self_or_admin" on public.event_participants;
create policy "event_participants_select_self_or_admin"
on public.event_participants
for select
to authenticated
using (user_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "event_participants_insert_self_or_admin" on public.event_participants;
create policy "event_participants_insert_self_or_admin"
on public.event_participants
for insert
to authenticated
with check (user_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- ---- Seed minimum content ----
insert into public.tasks (title, points, sort_order, is_active)
select *
from (
  values
    ('Учись 10 минут', 20, 10, true),
    ('Ответь на 5 вопросов', 30, 20, true),
    ('Поделись в VK', 10, 30, true)
) as seed(title, points, sort_order, is_active)
where not exists (select 1 from public.tasks);

insert into public.courses (
  title, title_zh, subtitle, level, status, type, tags, sort_order, cover_url, progress_percent, banner_label, cta_label, price
)
select *
from (
  values
    (
      'Персональная настройка курса',
      '个性定制',
      'Индивидуальный план под цель',
      'A1',
      'published',
      'Персональный',
      array['Индивидуально', 'Персональный план'],
      10,
      '/src/assets/courses/anime-course-personal.svg',
      20,
      'Пошаговый персональный квиз',
      'Пройти опрос',
      0
    ),
    (
      'Продвинутая персональная настройка',
      '高级定制',
      'Премиальный трек с глубокой настройкой',
      'A2',
      'published',
      'Продвинутый',
      array['Премиум', 'Глубокая настройка'],
      20,
      '/src/assets/courses/anime-course-advanced.svg',
      45,
      'VIP формат с наставником',
      'Выбрать VIP',
      0
    ),
    (
      'Групповой курс 4-6 человек',
      '小组课程（4-6人）',
      'Командная миссия для мини-группы',
      'HSK',
      'published',
      'Групповой',
      array['Мини-группа', '4-6 человек'],
      30,
      '/src/assets/courses/anime-course-travel.svg',
      10,
      'Командная миссия 4-6 участников',
      'Присоединиться к группе',
      0
    ),
    (
      'Бесплатный пробный урок',
      '免费试听',
      '20 минут знакомства с программой',
      'A1',
      'published',
      'Разговорный',
      array['Бесплатно', 'Пробный урок', '20 мин'],
      5,
      '/src/assets/courses/anime-course-trial.svg',
      0,
      'Бесплатная пробная тренировка',
      'Записаться на пробный',
      0
    )
) as seed(title, title_zh, subtitle, level, status, type, tags, sort_order, cover_url, progress_percent, banner_label, cta_label, price)
where not exists (select 1 from public.courses);

insert into public.events (title, subtitle, cover_url, status, rewards, link, weekly_prize, join_mode, meta)
select *
from (
  values
    (
      'Месяц китайского языка 🇨🇳',
      'Только в этом месяце',
      '/src/assets/events/anime-spring.svg',
      'Активные',
      array['Таинственный приз', 'Бонусы', 'Бесплатные уроки'],
      '/campaign/chinese-month',
      5000,
      'open',
      '{"countdown":"Только в этом месяце"}'::jsonb
    )
) as seed(title, subtitle, cover_url, status, rewards, link, weekly_prize, join_mode, meta)
where not exists (select 1 from public.events);

insert into public.study_groups (title, capacity, status, created_by)
select 'Основная мини-группа', 6, 'open', null
where not exists (select 1 from public.study_groups);

notify pgrst, 'reload schema';
