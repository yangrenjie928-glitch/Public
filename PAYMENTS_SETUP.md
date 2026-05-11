# YooKassa Subscription Setup

## 1) Merchant prerequisites

Prepare these values in YooKassa dashboard:

- `shopId`
- `secretKey`
- webhook endpoint URL (will point to `/api/payments/yookassa/webhook`)

## 2) Project environment variables

Create `.env.local` (local) and Vercel project envs (production) from `.env.example`.

Required server-side secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOOKASSA_SHOP_ID`
- `YOOKASSA_SECRET_KEY`
- `YOOKASSA_WEBHOOK_SECRET`
- `YOOKASSA_RETURN_URL`

Required client-side values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

## 3) YooKassa webhook

In YooKassa notifications, use:

- URL: `https://your-domain.com/api/payments/yookassa/webhook`
- Shared secret: same value as `YOOKASSA_WEBHOOK_SECRET`

## 4) Safe rollout

1. Add test merchant credentials.
2. Complete one test payment.
3. Confirm webhook writes into `webhook_events` and updates `subscriptions`.
4. Switch to production credentials.

## 5) Important security notes

- Never expose `YOOKASSA_SECRET_KEY` in frontend code.
- Webhook events are idempotent (`event_id` unique in DB).
- Access checks must read backend subscription status, not URL query params.
