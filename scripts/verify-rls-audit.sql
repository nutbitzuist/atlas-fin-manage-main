-- Supabase RLS Audit: run this script in the SQL Editor on the target project
-- after the growth workflow and audit migrations are applied.

-- 1) Confirm RLS is enabled for all growth/audit tables.
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'growth_referral_invites',
    'money_challenge_progress',
    'household_invites',
    'lifecycle_email_preferences',
    'trust_center_requests',
    'premium_selections',
    'ai_coach_events',
    'audit_events'
  )
order by tablename;

-- 2) Confirm policies are present and user-scoped.
select
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'growth_referral_invites',
    'money_challenge_progress',
    'household_invites',
    'lifecycle_email_preferences',
    'trust_center_requests',
    'premium_selections',
    'ai_coach_events',
    'audit_events'
  )
order by tablename, policyname;

-- 3) Optional owner-field sanity checks. (These should return zero rows for each table.)
select
  'growth_referral_invites' as table_name,
  count(*) as rows_without_owner
from public.growth_referral_invites
where user_id is null
union all
select
  'money_challenge_progress',
  count(*)
from public.money_challenge_progress
where user_id is null
union all
select
  'household_invites',
  count(*)
from public.household_invites
where inviter_user_id is null
union all
select
  'lifecycle_email_preferences',
  count(*)
from public.lifecycle_email_preferences
where user_id is null
union all
select
  'trust_center_requests',
  count(*)
from public.trust_center_requests
where user_id is null
union all
select
  'premium_selections',
  count(*)
from public.premium_selections
where user_id is null
union all
select
  'ai_coach_events',
  count(*)
from public.ai_coach_events
where user_id is null
union all
select
  'audit_events',
  count(*)
from public.audit_events
where user_id is null;
