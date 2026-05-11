-- YooKassa subscription billing tables and RLS.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null,
  provider text not null default 'yookassa',
  provider_subscription_id text,
  status text not null default 'pending',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null,
  provider text not null default 'yookassa',
  provider_payment_id text not null unique,
  idempotence_key text,
  amount numeric(10,2) not null,
  currency text not null default 'RUB',
  status text not null default 'pending',
  payment_type text not null default 'subscription_initial',
  paid_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'yookassa',
  event_id text not null,
  event_type text not null,
  signature text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.users
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists subscription_plan text,
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists subscription_cancel_at_period_end boolean not null default false;

create unique index if not exists idx_webhook_events_provider_event_id on public.webhook_events(provider, event_id);
create unique index if not exists idx_subscriptions_user_plan_provider on public.subscriptions(user_id, plan_code, provider);
create index if not exists idx_subscriptions_user_status on public.subscriptions(user_id, status, current_period_end desc);
create index if not exists idx_transactions_user_created on public.payment_transactions(user_id, created_at desc);
create index if not exists idx_transactions_provider_payment on public.payment_transactions(provider_payment_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_subscriptions_touch_updated_at on public.subscriptions;
create trigger trg_subscriptions_touch_updated_at
before update on public.subscriptions
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_payment_transactions_touch_updated_at on public.payment_transactions;
create trigger trg_payment_transactions_touch_updated_at
before update on public.payment_transactions
for each row
execute function public.touch_updated_at();

alter table public.subscriptions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists "subscriptions_select_self_or_admin" on public.subscriptions;
create policy "subscriptions_select_self_or_admin"
on public.subscriptions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin_user());

drop policy if exists "subscriptions_insert_admin_only" on public.subscriptions;
create policy "subscriptions_insert_admin_only"
on public.subscriptions
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "subscriptions_update_admin_only" on public.subscriptions;
create policy "subscriptions_update_admin_only"
on public.subscriptions
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "payment_transactions_select_self_or_admin" on public.payment_transactions;
create policy "payment_transactions_select_self_or_admin"
on public.payment_transactions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin_user());

drop policy if exists "payment_transactions_insert_admin_only" on public.payment_transactions;
create policy "payment_transactions_insert_admin_only"
on public.payment_transactions
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "payment_transactions_update_admin_only" on public.payment_transactions;
create policy "payment_transactions_update_admin_only"
on public.payment_transactions
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "webhook_events_select_admin_only" on public.webhook_events;
create policy "webhook_events_select_admin_only"
on public.webhook_events
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "webhook_events_insert_admin_only" on public.webhook_events;
create policy "webhook_events_insert_admin_only"
on public.webhook_events
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "users_update_self_or_admin" on public.users;
create policy "users_update_self_or_admin"
on public.users
for update
to authenticated
using (auth.uid() = id or public.is_admin_user())
with check (auth.uid() = id or public.is_admin_user());

notify pgrst, 'reload schema';
