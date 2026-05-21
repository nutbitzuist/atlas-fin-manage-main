-- Billing event ledger for checkout / entitlement webhook processing.
-- This table stores provider events so plan changes can be audited and replayed.

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null default 'manual',
  provider_event_id text not null unique,
  event_type text not null,
  subscription_tier text not null default 'Free' check (subscription_tier in ('Free', 'Plus', 'Pro')),
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.billing_events enable row level security;

drop policy if exists "Service role can manage billing events" on public.billing_events;
create policy "Service role can manage billing events"
on public.billing_events
for all
to service_role
using (true)
with check (true);

drop policy if exists "Users can view own billing events" on public.billing_events;
create policy "Users can view own billing events"
on public.billing_events
for select
to authenticated
using (auth.uid() = user_id);

create index if not exists billing_events_user_created_idx on public.billing_events(user_id, created_at desc);
create index if not exists billing_events_provider_idx on public.billing_events(provider, provider_event_id);
