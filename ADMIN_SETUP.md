# Supabase Admin Setup

## 1) Environment

Create `.env.local` in project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_MODEL=gpt-4o-mini
```

## 2) Run SQL migration

Execute this file in Supabase SQL editor:

- `supabase/migrations/20260422_admin_backend.sql`

It creates:

- `courses`, `events`, `question_bank`, `orders`, `funnel_events`
- `users` extensions (`role`, `status`, `updated_at`)
- RLS policies and indexes

## 3) Promote first admin

After registering your first account in app, run:

```sql
update public.users
set role = 'admin'
where email = 'your-admin@email.com';
```

## 4) Access admin pages

- Login: `/login`
- Admin console: `/admin`

Only users with `users.role = 'admin'` can access admin routes.
