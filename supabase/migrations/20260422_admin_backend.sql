-- Core admin backend schema and RLS policies
create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(trim(username)) > 0),
  email text not null unique,
  level integer not null default 0 check (level >= 0),
  exp integer not null default 0 check (exp >= 0),
  role text not null default 'user',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.users
  add column if not exists role text not null default 'user',
  add column if not exists status text not null default 'active',
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text default '',
  level text default 'A1',
  price numeric(10,2) not null default 0,
  status text not null default 'draft',
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text default '',
  cover_url text default '',
  status text not null default 'draft',
  start_at timestamptz,
  end_at timestamptz,
  join_mode text not null default 'open',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  type text not null default 'single',
  category text not null default 'vocabulary',
  difficulty text not null default 'A1',
  options jsonb not null default '[]'::jsonb,
  answer text not null default '',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null default 0,
  currency text not null default 'RUB',
  status text not null default 'pending',
  payment_channel text not null default 'card',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  step_name text not null,
  source text not null default 'web',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_role_status on public.users(role, status);
create index if not exists idx_orders_status_created_at on public.orders(status, created_at desc);
create index if not exists idx_funnel_step_created_at on public.funnel_events(step_name, created_at desc);
create index if not exists idx_events_status_start_at on public.events(status, start_at desc);

alter table public.courses enable row level security;
alter table public.events enable row level security;
alter table public.question_bank enable row level security;
alter table public.orders enable row level security;
alter table public.funnel_events enable row level security;
alter table public.users enable row level security;

drop policy if exists "users_select_self_or_admin" on public.users;
create policy "users_select_self_or_admin"
on public.users
for select
to authenticated
using (auth.uid() = id or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "users_update_self_or_admin" on public.users;
create policy "users_update_self_or_admin"
on public.users
for update
to authenticated
using (auth.uid() = id or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
with check (auth.uid() = id or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "users_insert_self_or_admin" on public.users;
create policy "users_insert_self_or_admin"
on public.users
for insert
to authenticated
with check (auth.uid() = id or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "admin_manage_courses" on public.courses;
create policy "admin_manage_courses"
on public.courses
for all
to authenticated
using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "admin_manage_events" on public.events;
create policy "admin_manage_events"
on public.events
for all
to authenticated
using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "admin_manage_question_bank" on public.question_bank;
create policy "admin_manage_question_bank"
on public.question_bank
for all
to authenticated
using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "orders_select_self_or_admin" on public.orders;
create policy "orders_select_self_or_admin"
on public.orders
for select
to authenticated
using (user_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin"
on public.orders
for update
to authenticated
using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "orders_insert_self_or_admin" on public.orders;
create policy "orders_insert_self_or_admin"
on public.orders
for insert
to authenticated
with check (user_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "funnel_insert_self_or_admin" on public.funnel_events;
create policy "funnel_insert_self_or_admin"
on public.funnel_events
for insert
to authenticated
with check (user_id = auth.uid() or user_id is null or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

drop policy if exists "funnel_select_admin" on public.funnel_events;
create policy "funnel_select_admin"
on public.funnel_events
for select
to authenticated
using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));
