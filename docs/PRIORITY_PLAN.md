# Atlas Project Priority Plan

Last updated: 2026-05-20

## P0: Already Started

1. Automated tests for core money logic
   - Status: Completed for the first coverage layer.
   - Added Vitest and unit coverage for planning utilities and investment valuation.
   - Added CSV import parser and mapper coverage.
   - Next: add component/integration tests for bills calendar, budgets, and reports.

2. Supabase RLS validation
   - Status: In progress.
   - Added `docs/RLS_AUDIT.md`.
   - Added owner-scoped RLS policies for new growth workflow tables.
   - Added executable script `scripts/verify-rls-audit.sql` for deployment-side verification.
   - Next: run this script against the deployed Supabase project.

3. Dedicated growth workflow tables
   - Status: Completed for the app-local workflow state layer.
   - Added migration `20260520000004_create_growth_workflow_tables.sql`.
   - Migrated `GrowthWorkspace` from profile-only persistence to dedicated tables while preserving profile JSON as a compatibility mirror.

## P1: Next Engineering Work

4. Playwright smoke tests
   - Status: Completed.
   - Added browser-level smoke tests for public route rendering and anonymous protected-route redirect.
   - Added authenticated browser tests for dashboard shell visibility, bills calendar view toggle, report export interactions, and CSV upload path.
   - Added deeper interaction coverage for bills filters/view modes, budget workflow validation, and report-type switching.

 5. Supabase service layer
  - Status: In progress.
  - Extract repeated page-level queries into typed services/hooks.
  - Added growth workflow persistence service, transaction import/insert service, and shared profile preferences service.
  - Progress:
    - added savings-goal service extraction for create/update/delete/read flows and preference-section persistence helper.
    - added shared asset/liability summary service and switched `Index`, `Assets`, `Liabilities`, `NetWorth`, `Reports`, `DailyBrief`, `FinancialHealth`, `MonthlyUpdate`, `FinancialInsights`, `CashFlow`, and `TaxPlanning` to use it for aggregate reads.
  - Next: migrate remaining direct page-level reads for `FinancialHealth`, `TaxPlanning` detail persistence, `Investments`, `NetWorth` history writes, `CashFlow`/`WeeklyReview` refresh paths, and `Index` activity freshness writes.

6. Split large pages
   - Break `Insurance`, `Budget`, `CashFlow`, `ReportsAnalytics`, and `GrowthWorkspace` into hooks plus focused components.

7. Real delivery integrations
   - Add provider-backed referral invites, household invites, lifecycle emails, and trust request processing.

## P2: Scale And Migration Work

8. Bundle performance
   - Status: Started.
   - Lazy-load reports, html2canvas/jsPDF, large chart routes, and public content sections.
   - Report routes are already route-lazy; html2canvas and jsPDF are now loaded only when export/share actions run.

9. Major dependency migrations
   - Migrate in controlled phases: Vite, React Router, React, Tailwind, Recharts, Zod.
   - Each phase needs visual and flow regression checks.

10. Production observability
   - Status: Started.
   - Add error tracking, product analytics events, and audit logs for sensitive finance actions.
   - Added user-owned `audit_events` migration and non-blocking audit logging for CSV imports, bill payments, trust requests, referral/household invites, premium selection, and AI coach activity.
   - Next: wire a hosted error tracker and broader product analytics events.
