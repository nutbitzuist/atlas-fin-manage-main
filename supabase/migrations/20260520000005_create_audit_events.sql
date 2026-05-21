-- Audit events for sensitive finance and account actions.
-- These rows are user-owned and intentionally append-only from the client.

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_events enable row level security;

drop policy if exists "Users can insert their audit events" on public.audit_events;
create policy "Users can insert their audit events"
on public.audit_events
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can view their audit events" on public.audit_events;
create policy "Users can view their audit events"
on public.audit_events
for select
to authenticated
using (auth.uid() = user_id);

create index if not exists audit_events_user_created_idx on public.audit_events(user_id, created_at desc);
create index if not exists audit_events_user_type_idx on public.audit_events(user_id, event_type, created_at desc);
