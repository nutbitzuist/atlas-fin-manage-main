# Billing Webhook Setup (Supabase)

This app expects a single webhook endpoint at:

- `POST /functions/v1/billing-webhook`

Use this checklist before turning on paid plans in production.

## 1) Required environment

Set these for your deployment/runtime:

- `BILLING_WEBHOOK_SECRET`: shared secret required in header `x-billing-webhook-secret`.
- `SUPABASE_URL`: backend URL used by the function.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key used to write `billing_events` and `premium_selections`.
- `VITE_CHECKOUT_URL_PLUS`: checkout URL for `Plus` plan.
- `VITE_CHECKOUT_URL_PRO`: checkout URL for `Pro` plan.
- `VITE_BILLING_PORTAL_URL`: customer portal URL for plan/cancel/change.

> `BILLING_WEBHOOK_SECRET` / `SUPABASE_SERVICE_ROLE_KEY` must never be exposed in frontend code.

## 2) Provider webhook payload contract

The handler accepts JSON body with required keys:

- `provider_event_id` (required): unique event id per provider event.
- `user_id` (optional but required for entitlement updates).
- `subscription_tier` or `selected_tier` (optional): `Free` | `Plus` | `Pro`.

Optional fields:

- `provider` (default `manual`)
- `event_type` (default `subscription.updated`)
- `status`
- `payload` (stored as audit trail metadata)

If `status` or `event_type` indicates cancellation (`canceled`, `cancelled`, `expired`, `void`, etc.), the tier is treated as `Free`.

## 3) Connect a payment provider

1. Create a webhook target for `billing-webhook` in your provider.
2. Use header `x-billing-webhook-secret` with the exact value `BILLING_WEBHOOK_SECRET`.
3. Map checkout success/cancel URLs to:
   - `/billing/success`
   - `/billing/cancel`

### Supabase CLI example

```bash
supabase secrets set \
  BILLING_WEBHOOK_SECRET=your_shared_secret \
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

supabase functions deploy billing-webhook

supabase functions serve billing-webhook --no-verify-jwt
```

If you use Vercel for frontend envs, set:

```bash
VITE_CHECKOUT_URL_PLUS=https://provider/checkout?price=plus
VITE_CHECKOUT_URL_PRO=https://provider/checkout?price=pro
VITE_BILLING_PORTAL_URL=https://provider/customer-portal
```

## 4) Validation steps

1. Complete an upgrade flow end-to-end.
2. Confirm the user row in `premium_selections` updates.
3. Confirm a row is written to `billing_events`.
4. Confirm `/household`, `/ai-coach`, and `/growth-dashboard` visibility updates automatically.
5. Confirm downgrade/cancel payload sends `Free` tier or cancellation status.

### Automated smoke test (recommended before paid rollout)

You can run the repository-provided smoke script against staging:

```bash
SUPABASE_URL=https://<project-ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
BILLING_WEBHOOK_SECRET=<provider-secret> \
TEST_USER_ID=<uuid-of-test-user> \
npm run ops:webhook-smoke
```

The script sends:

1. `subscription.updated` for `Plus` (active)
2. `subscription.canceled` event (downgrade to Free)
3. `subscription.updated` with the same `provider_event_id` as step 1 to validate idempotency

It prints raw webhook responses and checks both `premium_selections` and `billing_events` snapshots for the test user.

## 5) Required database objects

- `public.billing_events`
- `public.premium_selections`
- `public.audit_events`
