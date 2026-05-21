# Supabase RLS Audit

Last updated: 2026-05-20

## Scope

This audit covers the new growth workflow and audit tables introduced after the roadmap implementation:

- `growth_referral_invites`
- `money_challenge_progress`
- `household_invites`
- `lifecycle_email_preferences`
- `trust_center_requests`
- `premium_selections`
- `ai_coach_events`
- `audit_events`

## Required Guarantees

- Every table has RLS enabled.
- Every user-owned table has a `user_id` or equivalent owner column.
- Users can only select, insert, update, or delete their own rows.
- Invite tables do not expose invitee emails to unrelated users.
- Trust center deletion/export requests are visible only to the requesting user.
- Future admin/reporting access must be added through explicit service-role or admin policies, not broad authenticated-user policies.

## Current Policy Model

The migration `20260520000004_create_growth_workflow_tables.sql` creates owner-scoped `FOR ALL` policies:

- `auth.uid() = user_id` for user-owned tables.
- `auth.uid() = inviter_user_id` for household invite sender ownership.

This is appropriate for the current client-side product because users only need to manage their own growth records.

The migration `20260520000005_create_audit_events.sql` creates append-oriented policies:

- Users can insert their own audit events.
- Users can select their own audit events.
- Client-side update/delete policies are intentionally omitted.

## Validation Checklist

Run these checks after applying migrations in Supabase:

1. Confirm RLS is enabled:
   ```sql
   select schemaname, tablename, rowsecurity
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
     );
   ```

2. Confirm each table has at least one policy:
   ```sql
   select schemaname, tablename, policyname, cmd, qual, with_check
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
   ```

4. Optional repeatable execution script:
   - Use `scripts/verify-rls-audit.sql` in the Supabase SQL Editor after migration deploy.
   - The script validates RLS status, policy presence, and owner-field integrity for the target tables.

3. Client verification:
   - User A can insert and read their own referral invite.
   - User B cannot read or update User A's referral invite.
   - User A can record a deletion request.
   - User B cannot see User A's deletion request.
   - Household invitee email rows are visible only to the inviter until an explicit accepted-household membership model exists.
   - User A can insert and read their own audit events.
   - User A cannot update or delete client-created audit events.
   - User B cannot read User A's audit events.

## Open Follow-Ups

- Add admin/service reporting views once growth analytics leaves the client dashboard.
- Add explicit accepted household membership tables before allowing two users to share budgets or goals.
- Add delivery-provider event tables for sent, bounced, opened, clicked, and unsubscribed lifecycle emails.
- Expand audit event coverage across all create/update/delete finance actions.
