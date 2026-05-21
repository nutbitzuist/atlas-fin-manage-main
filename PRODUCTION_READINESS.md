# Production Readiness Checklist (Atlas Finance)

## Completed in this hardening pass

- Protected and public route behavior aligned.
- Core e2e route assertions updated to current app copy.
- Deployment security headers configured in `vercel.json`.
- Local storage write/read paths in protected modules hardened for restricted browser modes.
- Error recovery fallback changed from `/dashboard` to `/` to avoid protected-route dead loops.
- Environment placeholders normalized (`.env.local`, `.env.example`) and sensitive `.env` excluded.
- Premium feature gating and billing entitlement snapshot added.
- Billing webhook + event ledger migration and Supabase Edge Function added.
- Public checkout return pages and legal routes implemented (`/billing/success`, `/billing/cancel`, `/privacy`, `/terms`).

## Must-complete items before public launch

1. **Authentication and session integrity**
   - Enforce email verification policy for new accounts.
   - Review Supabase Auth settings for token expiry, refresh, and MFA options.
   - Add inactivity timeout/forced reauth for sensitive actions (optional).

2. **Billing/subscription flow**
  - Connect checkout URLs to your provider checkout and validate redirect URLs.
  - Validate webhook signature + retry behavior against your real provider.
  - Test renewal/cancel/downgrade paths in staging with a test customer.
  - Add status-aware entitlement messaging (active/trial/grace/expired).

3. **Data privacy and legal**
   - Add user-facing privacy policy and terms pages/links.
   - Confirm data retention and export/delete flow are complete and documented.
   - Add consent and cookie controls if tracking is enabled.

4. **Observability and incident readiness**
   - Add centralized error logging for production (Sentry or equivalent).
   - Add structured logs for key failures (auth/session, billing, CSV import/export).
   - Define runbook for major incident response.

5. **Ops/security hardening**
   - Add rate limiting + abuse protections for auth-sensitive endpoints.
   - Review CSP/script policies after final analytics provider setup.
   - Add monitoring alerts for build/deploy failures and API error spikes.

6. **Operations and deployment**
   - Set up environment secrets in deployment platform (no local `.env` usage).
   - Configure backup/restore and rollback strategy for DB/migrations.
   - Add staging smoke test workflow and production canary release flow.

7. **Quality assurance**
   - Keep automated end-to-end suite green after subscription UI integration.
   - Add payment and privileged-flow tests once payment backend is wired.
   - Add regression tests for permission/feature-gating.

## Recommended launch sequence

- Freeze schema and migration plan.
- Enable monitoring + logging.
- Turn on staging + production secrets.
- Execute smoke path manually (`signup -> login -> core shell -> one protected page`).
- Enable public signup/billing gradually behind a small feature flag.
- Monitor first-day conversion, auth failures, and report/export workflows.

## Final launch execution checklist (now action-ready)

### 1) Billing webhook + entitlement smoke test (staging)

Run this in staging with a real test account:

1. Set env values in your terminal:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `BILLING_WEBHOOK_SECRET`
   - `TEST_USER_ID`
   - (Optional) `SUPABASE_FUNCTION_URL` if you use a custom functions host
2. Execute:
   - `npm run ops:webhook-smoke`

Expected outcome:

- Step 1 (`upgrade-plus`): `premium_selections.selected_tier` becomes `Plus` and event row appears in `billing_events`.
- Step 2 (`downgrade-to-free-cancelled`): tier becomes `Free`.
- Step 3 (`replay-plus-webhook` with the same `provider_event_id`): function remains stable (same `provider_event_id` should not create duplicate event rows due to upsert conflict key).

### 2) Auth + entitlement integrity check

- Run `scripts/verify-rls-audit.sql` in Supabase SQL editor.
- Confirm `premium_selections` has only the read policy under `authenticated` and no client-write policy.
- Confirm `billing_events` policy remains service-role write + authenticated read.

### 3) Production launch prerequisites

- Checkout URL + portal URL environment variables are present in frontend and frontend build:
  - `VITE_CHECKOUT_URL_PLUS`
  - `VITE_CHECKOUT_URL_PRO`
  - `VITE_BILLING_PORTAL_URL`
- Supabase secrets present in production runtime:
  - `BILLING_WEBHOOK_SECRET`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Billing return pages (`/billing/success`, `/billing/cancel`) are reachable.
- Core legal links appear in footer/header and load successfully.

## Billing integration contract

- Checkout URLs are configured through `VITE_CHECKOUT_URL_PLUS`, `VITE_CHECKOUT_URL_PRO`, and `VITE_BILLING_PORTAL_URL`.
- Webhooks are received by the Supabase Edge Function `billing-webhook`.
- The function expects `BILLING_WEBHOOK_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in Supabase secrets.
- Webhook payloads should include `user_id`, `provider_event_id`, and `subscription_tier` or `selected_tier`.
- See `BILLING_WEBHOOK_SETUP.md` for deployment and test steps.
