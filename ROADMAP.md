# Atlas Finance Growth & Product Roadmap

## North Star

Build Atlas Finance into the daily personal finance command center for Thai and international users who want to know what to do with their money today, this week, this month, and this year.

The product should not only record financial data. It should turn that data into decisions, habits, progress, confidence, and shareable wins.

## 50k DAU Strategy

50k daily active users requires four engines working together:

1. Acquisition: SEO calculators, templates, educational pages, referrals, and social sharing.
2. Activation: first financial health score, first cash forecast, first recommended action, and saved calculator results.
3. Retention: daily brief, weekly review, monthly close, alerts, streaks, goals, and progress loops.
4. Virality: shareable score cards, challenge results, calculator outputs, household invites, and referral rewards.

Programmatic SEO is important, but it must be useful and tool-led. Avoid scaled thin content. Public pages should provide original calculators, Thai-specific assumptions, clear examples, structured data, and a strong reason to save results into Atlas.

## Product Principles

- Manual-first, Thai-market-aware: do not depend on Thai bank sync.
- Action-first: every insight should answer "what should I do next?"
- Privacy-first: sharing should hide exact amounts by default.
- Utility-first SEO: calculators and templates before generic articles.
- Habit-first retention: small daily/weekly loops beat occasional big reports.
- Trust-first finance: transparent assumptions, clear disclaimers, and export/delete controls.

## Success Metrics

### Activation

- Visitor-to-signup conversion from calculator pages
- Signup-to-first-financial-health-score completion
- Signup-to-first-transaction or first-goal completion
- Signup-to-first-recommended-action completion

### Retention

- D1, D7, D30 retention
- DAU/MAU ratio
- Daily brief completion rate
- Weekly review completion rate
- Monthly update completion rate
- Notification click-through rate

### Engagement

- Average sessions per user per week
- Transactions reviewed per week
- Goals updated per month
- Budget categories configured
- Alerts acted on
- Reports exported/shared

### Growth

- Organic clicks by page type
- Calculator completion rate
- Calculator-result save rate
- Referral invite rate
- Referral signup conversion
- Share card creation rate

### Monetization

- Free-to-paid conversion
- Trial activation rate
- Premium feature usage
- Churn by cohort
- Revenue per active user

## Phase 1: Retention Foundation

Goal: make existing users return every week, then every day.

### 1. Daily Finance Brief

Status: Implemented in first pass.

Build a daily "what needs my attention today?" experience.

Features:

- Dashboard brief card
- Dedicated `/daily-brief` page
- Cash position summary
- Bills due soon
- Spending pace vs budget
- Category warnings
- Goal progress updates
- Debt/payment reminders
- One recommended action
- Mark action as done
- Brief history

Acceptance criteria:

- User can open a daily brief from navigation/dashboard.
- Brief loads from existing Supabase data.
- Brief shows at least one useful next action when data exists.
- Brief handles empty states gracefully.
- User can mark the daily brief completed.

Metrics:

- Daily brief view rate
- Brief completion rate
- Action click-through rate
- D7 retention lift

### 2. Weekly Money Review

Status: Implemented in first pass.

Build a guided weekly review flow that turns data into progress.

Features:

- `/weekly-review` page
- Weekly income/expense summary
- Top spending changes
- Budget status
- Goals updated this week
- Bills paid/missed
- Debt movement
- Recommended next-week focus
- Shareable weekly summary card

Acceptance criteria:

- User can complete a weekly review in under 3 minutes.
- Weekly review stores completion status.
- User receives a clear next-week recommendation.

Metrics:

- Weekly review completion rate
- Weekly active users
- Share card generation rate

### 3. Monthly Review 2.0

Status: Implemented in first pass.

Expand the existing monthly update into a full monthly close.

Features:

- Net worth change
- Savings rate
- Cash flow summary
- Debt payoff movement
- Investment performance
- Tax-deductible contribution summary
- Next-month suggested budget
- Export/share PDF or image summary

Acceptance criteria:

- Monthly update produces a summary without manual writing.
- User can export or share a privacy-safe version.

Metrics:

- Monthly update completion rate
- Export/share rate
- Month-over-month returning user rate

### 4. Financial Streaks

Status: Implemented in first pass.

Create meaningful consistency loops.

Features:

- Expense review streak
- Daily brief streak
- Weekly review streak
- Monthly close streak
- Savings contribution streak
- On-time bill streak
- Debt reduction streak

Acceptance criteria:

- Streaks are calculated from real activity.
- Streaks are visible on dashboard/profile.
- Streaks do not punish users unfairly for timezone/date edge cases.

Metrics:

- Streak participation rate
- Retention by streak cohort

### 5. Notifications Expansion

Status: Implemented in first pass.

Turn existing notification infrastructure into proactive retention.

Features:

- Bill due soon
- Budget 80% used
- Budget exceeded
- Negative cash flow warning
- Goal behind schedule
- Credit utilization high
- Tax deduction opportunity
- Insurance renewal
- Monthly update incomplete
- Weekly review reminder

Acceptance criteria:

- Notifications are deduplicated.
- Notifications include relevant links.
- User can mark notifications as read.
- User can opt out by category.

Metrics:

- Notification click-through rate
- Notification action completion rate

## Phase 2: Product Value Expansion

Goal: make Atlas feel like a complete personal finance operating system.

### 6. Goal Planning Engine

Status: Implemented in first pass.

Features:

- Required monthly contribution
- Target date feasibility
- Behind/ahead status
- Goal priority ranking
- Surplus allocation suggestions
- Emergency-fund-first recommendation
- What-if monthly contribution simulator

Acceptance criteria:

- Every savings goal shows required monthly contribution if target date exists.
- User can simulate contribution changes.
- App identifies impossible or risky goal timelines.

### 7. Debt Planner 2.0

Status: Implemented in first pass.

Features:

- Avalanche vs snowball comparison
- Total interest estimate
- Interest saved with extra payment
- Debt-free date
- Payoff timeline chart
- Credit utilization improvement plan

Acceptance criteria:

- User can compare two payoff methods.
- User can see estimated payoff date and interest impact.

### 8. Cash Flow Simulator

Status: Implemented in first pass.

Features:

- Can I afford this purchase?
- Income-drop scenario
- Rent/bill increase scenario
- Extra investment scenario
- Extra debt payment scenario
- 30/60/90-day projection chart
- Save scenarios

Acceptance criteria:

- User can model a scenario without changing real data.
- Scenario clearly labels assumptions.

### 9. Smart Budget Builder

Status: Implemented in first pass.

Features:

- Analyze last 3 months
- Recommend category limits
- Fixed vs flexible spending
- Starter budget generation
- Copy last month
- Auto-adjust based on overspending

Acceptance criteria:

- User can generate a full monthly budget from history.
- User can accept/edit recommendations before saving.

### 10. Subscription & Bill Optimizer

Status: Implemented in first pass.

Features:

- Detect recurring subscriptions
- Monthly/annual cost summary
- Bill increase detection
- Renewal calendar
- Cancel/keep workflow
- Subscription savings estimate

Acceptance criteria:

- User can review recurring expenses and mark decisions.

### 11. Investment Performance Dashboard

Status: Implemented in first pass.

Features:

- Cost basis
- Unrealized gain/loss
- Realized gain/loss
- Dividend/income tracking
- Allocation by asset type/currency/risk
- Target allocation
- Rebalancing suggestions

Acceptance criteria:

- Investment list shows performance, not only value.
- User can see portfolio drift vs target.

Implementation notes:

- Added a portfolio-wide performance dashboard with cost basis, current value, unrealized gain/loss, total return, and tax-advantaged value.
- Added asset-type allocation, currency exposure, target allocation drift, rebalancing suggestions, top/weakest position, and concentration/trading risk signals.

### 12. Thai Tax Optimization Assistant

Status: Implemented in first pass.

Features:

- RMF contribution tracker
- SSF contribution tracker
- Thai ESG contribution tracker
- Life/health insurance deduction tracker
- Donation deduction tracker
- Mortgage interest tracker
- Annual tax estimate
- Remaining deduction room
- Year-end tax checklist

Acceptance criteria:

- User can see estimated tax-saving opportunities for the current tax year.
- Tax assumptions are visible.

Implementation notes:

- Added a Thai Tax Optimization Assistant with marginal/effective tax rates, remaining deduction room, estimated tax savings, and highest-impact recommendations.
- Added a year-end checklist for RMF/SSF/Thai ESG purchases, insurance certificates, home-loan interest, donations, and saved-plan completion.
- Added visible assumptions for tax brackets, personal allowance, synced data, and deduction caps.

### 13. Insurance Coverage Check

Status: Implemented in first pass.

Features:

- Coverage gap analysis
- Annual premium summary
- Renewal reminders
- Tax-deductible premium tracking
- Beneficiary completeness check

Acceptance criteria:

- User can identify missing/expiring insurance coverage.

Implementation notes:

- Added an Insurance Coverage Check with default coverage targets, total gap, missing core coverage, renewal urgency, and beneficiary-gap counts.
- Added coverage-gap progress by life, health/critical, vehicle, and property protection plus recommended action cards.
- Connected premium tax-deduction room and renewal/beneficiary checks into the action plan.

### 14. Financial Health Action Plan

Status: Implemented in first pass.

Features:

- Top 3 score-improving actions
- Estimated score impact
- Difficulty level
- Time required
- Action completion tracking

Acceptance criteria:

- Financial health page explains exactly how to improve the score.

## Phase 3: Programmatic SEO Engine

Goal: acquire high-intent users through useful public tools and templates.

### 15. Public Calculator Library

Status: Implemented in first pass.

Build indexable calculators:

- Thai income tax calculator
- RMF deduction calculator
- SSF deduction calculator
- Thai ESG deduction calculator
- Emergency fund calculator
- Savings goal calculator
- Debt avalanche calculator
- Debt snowball calculator
- Credit card payoff calculator
- Mortgage affordability calculator
- Car loan calculator
- Compound interest calculator
- Retirement savings calculator
- Net worth calculator
- Budget planner calculator
- Inflation impact calculator
- Financial health score calculator

Each calculator page needs:

- Interactive calculator
- THB examples
- Explanation of assumptions
- FAQ section
- Structured data
- Internal links
- Save result to Atlas CTA
- Shareable result card

Acceptance criteria:

- Pages are crawlable and fast.
- Each page has unique utility, not only templated text.
- Results can be saved by authenticated users.

Implementation notes:

- Added public `/calculators` index and `/calculators/:slug` pages for 17 finance calculators.
- Each calculator includes interactive inputs, THB-oriented examples, assumptions, FAQ, structured data, save CTA, related workflow links, and copyable share-card results.
- Added structured data support to the shared SEO component.

### 16. Programmatic Comparison Pages

Status: Implemented in first pass.

Examples:

- RMF vs SSF vs Thai ESG
- Debt snowball vs avalanche
- Rent vs buy in Bangkok
- Emergency fund by income level
- How much to save monthly for ฿1M

Acceptance criteria:

- Pages include calculator-backed examples.
- Pages link to relevant app workflows.

Implementation notes:

- Added public `/guides` index and `/guides/:slug` pages for comparison topics including RMF vs SSF vs Thai ESG, debt snowball vs avalanche, rent vs buy in Bangkok, emergency fund by income level, and monthly saving for ฿1M.
- Each guide includes comparison cards, calculator-backed examples, key takeaways, calculator links, and Atlas workflow CTAs.

### 17. Location/Use-Case Pages

Status: Implemented in first pass.

Examples:

- Bangkok cost-of-living budget planner
- Chiang Mai monthly budget template
- Emergency fund calculator for Bangkok expenses

Acceptance criteria:

- Each page has unique assumptions or useful local data.
- No city-name-only duplicate pages.

Implementation notes:

- Added public `/use-cases` index and `/use-cases/:slug` pages for Bangkok cost-of-living budgeting, Chiang Mai monthly budgeting, and Bangkok emergency fund planning.
- Each page includes unique category assumptions, monthly totals, emergency-fund snapshots, calculator links, Atlas recreation CTA, and structured data.

### 18. Template Library

Status: Implemented in first pass.

Templates:

- Budget spreadsheet
- Thai tax checklist
- Monthly money review template
- Debt payoff spreadsheet
- Net worth tracker
- Emergency fund tracker
- Insurance tracker
- Investment tracker

Acceptance criteria:

- Templates can be downloaded or recreated inside Atlas.
- Template pages convert to signup.

Implementation notes:

- Added public `/templates` index and `/templates/:slug` pages for budget, Thai tax, monthly review, debt payoff, net worth, emergency fund, insurance, and investment templates.
- Each template includes a CSV preview, downloadable CSV generation, structured data, and recreate-in-Atlas signup CTA.

### 19. Finance Education Hub

Status: Implemented in first pass.

Topics:

- Savings rate
- Debt-to-income ratio
- Credit utilization
- Emergency fund
- RMF
- SSF
- Thai ESG
- Net worth
- Cash flow
- Sinking funds
- Compound interest

Acceptance criteria:

- Every education page links to a calculator and product workflow.

Implementation notes:

- Added public `/learn` index and `/learn/:slug` lessons for savings rate, debt-to-income, credit utilization, emergency funds, RMF, SSF, Thai ESG, net worth, cash flow, sinking funds, and compound interest.
- Each lesson includes a definition, formula, benchmark, next actions, calculator CTA, Atlas workflow CTA, and structured data.

### 20. SEO Technical Foundation

Status: Implemented in first pass.

Features:

- Public SEO route architecture
- Dynamic metadata
- Sitemap by page type
- Canonical tags
- Structured data
- Breadcrumbs
- FAQ schema where appropriate
- Core Web Vitals monitoring
- Internal linking graph
- Search Console indexation monitoring

Acceptance criteria:

- Public SEO pages are discoverable.
- Sitemap includes all public pages.
- No private app routes are indexed.

Implementation notes:

- Added build-time sitemap generation for public landing, calculators, guides, use cases, templates, and education pages.
- Updated robots rules to disallow private app routes while allowing public acquisition pages and social crawlers.
- Added structured data support to the shared SEO component and used it across public SEO page types.

## Phase 4: Sharing & Virality

Goal: make progress worth sharing.

### 21. Shareable Financial Score Card

Status: Implemented in first pass.

Features:

- Privacy-safe score card
- Hide exact amounts by default
- Share by image
- Share by expiring private link
- Milestone captions

Acceptance criteria:

- User can create a share card from financial health.

Implementation notes:

- Added a shareable financial health score card with privacy-safe default, exact amounts hidden, optional metric status signals, milestone captions, copyable caption, and downloadable PNG export.

### 22. Shareable Calculator Results

Status: Implemented in first pass.

Features:

- Calculator result image
- Copyable summary
- Private result link
- Save to Atlas CTA

Acceptance criteria:

- Every public calculator can generate a shareable result.

Implementation notes:

- Upgraded public calculator result cards with downloadable PNG exports, copyable summary text, query-param private result links, and save-to-Atlas CTAs.

### 23. Referral Program

Status: Implemented in first pass.

Features:

- Invite link
- Friend signup attribution
- Reward after first health score completion
- Referral dashboard

Acceptance criteria:

- Referral conversion is measurable.

Implementation notes:

- Added protected referral workspace with generated invite link, invite email input, signup/reward dashboard, and measurable attribution-ready referral code.

### 24. Money Challenges

Status: Implemented in first pass.

Challenges:

- 7-day expense awareness
- 30-day category no-spend
- Emergency fund starter
- ฿10,000 savings challenge
- Credit utilization challenge

Acceptance criteria:

- User can join, track, complete, and share a challenge.

Implementation notes:

- Added protected money challenges workspace with challenge catalog, progress tracking UI, and join/share-ready challenge cards.

### 25. Household / Couple Mode

Status: Implemented in first pass.

Features:

- Invite household member
- Shared budget
- Shared goals
- Private personal accounts
- Bill responsibilities
- Monthly household report

Acceptance criteria:

- User can invite another user into a shared household workspace.

Implementation notes:

- Added protected household workspace covering invite flow, shared budget, shared goals, bill responsibilities, monthly household reports, and private personal account positioning.

## Phase 5: Trust, Monetization, And Scale

Goal: become trustworthy, monetizable, and scalable.

### 26. Privacy & Trust Center

Status: Implemented in first pass.

Features:

- Privacy policy page
- Data export
- Delete account/data
- Security explanation
- Data use statement
- Manual-first Thai bank positioning

Acceptance criteria:

- User can understand, export, and delete their data.

Implementation notes:

- Added protected trust center with data export, deletion request CTA, privacy/security positioning, and manual-first Thai bank messaging.

### 27. Premium Packaging

Status: Implemented in first pass.

Potential premium features:

- Advanced forecasts
- Unlimited history
- PDF exports
- Tax planning
- Investment performance
- Household mode
- Advanced alerts
- Scenario planning
- AI coach

Acceptance criteria:

- Premium feature gates are clear and fair.

Implementation notes:

- Added protected premium packaging workspace with Free, Plus, and Pro tiers and clear feature-gate preview cards.

### 28. AI Finance Coach

Status: Implemented in first pass.

Features:

- Summarize my month
- Find spending leaks
- Suggest budget cuts
- Explain my health score
- Create debt payoff plan
- Generate tax checklist
- Ask questions about my own data

Acceptance criteria:

- AI responses cite user data used.
- Advice has appropriate disclaimers.

Implementation notes:

- Added protected AI coach workspace with guided prompt categories, data-citation expectations, and advice disclaimer positioning.

### 29. Lifecycle Emails

Status: Implemented in first pass.

Email flows:

- Onboarding
- Weekly review
- Monthly close
- Goal behind schedule
- Bill reminders
- Tax season
- Milestone celebration

Acceptance criteria:

- Emails are preference-controlled.
- Key flows are measurable.

Implementation notes:

- Added protected lifecycle email workspace with preference toggles for onboarding, weekly review, monthly close, bill reminders, tax season, and milestone flows.

### 30. Analytics & Growth Dashboard

Status: Implemented in first pass.

Features:

- Activation funnel
- DAU/MAU
- Retention cohorts
- SEO landing page conversion
- Calculator completion
- Referral conversion
- Feature adoption
- Churn signals

Acceptance criteria:

- Product decisions can be made from dashboard data.

Implementation notes:

- Added protected growth dashboard workspace with activation, DAU/MAU, retention, SEO conversion, referral conversion, feature adoption, and churn signal metric cards.

## Build Order

### Milestone A: Daily Habit Loop

1. Daily Finance Brief
2. Notifications expansion
3. Weekly Money Review
4. Financial streaks
5. Monthly Review 2.0

### Milestone B: Planning Intelligence

6. Goal Planning Engine
7. Debt Planner 2.0
8. Cash Flow Simulator
9. Smart Budget Builder
10. Financial Health Action Plan

### Milestone C: Thai Finance Differentiation

11. Thai Tax Optimization Assistant
12. Investment Performance Dashboard
13. Insurance Coverage Check
14. Subscription & Bill Optimizer

### Milestone D: SEO Acquisition

15. SEO technical foundation
16. Public calculator library
17. Template library
18. Programmatic comparison pages
19. Education hub
20. Location/use-case pages

### Milestone E: Virality & Scale

21. Shareable financial score card
22. Shareable calculator results
23. Referral program
24. Money challenges
25. Household mode
26. Trust center
27. Premium packaging
28. AI coach
29. Lifecycle emails
30. Growth dashboard

## Immediate Next Build

Current task:

- Continue hardening launch readiness by reducing lint warnings, adding deeper automated coverage, and validating Supabase policies for newly persisted growth preferences.
- Add dedicated Supabase tables when referral, challenge, household, lifecycle email, premium, and trust workflows need team-level reporting beyond profile preferences.
- Add real delivery integrations for referrals, household invites, lifecycle emails, and deletion requests when the product is ready to send external messages.

## Implementation Log

### 2026-05-03

- Created `ROADMAP.md`.
- Added `daily_briefs` Supabase migration for daily completion tracking.
- Added protected `/daily-brief` route.
- Added Daily Brief navigation item.
- Added dashboard CTA into the Daily Brief.
- Daily Brief now summarizes cash balance, 90-day projected cash, monthly cash flow, budget usage, bills due soon, credit utilization risk, savings goal risk, and today's action list.
- Daily Brief can be marked complete and upserted by user/date.
- Added authenticated notification insert policy and dedupe-key index.
- Added smart notification generator for cash forecast risk, bills due soon, budget usage, goals behind schedule, daily brief reminders, monthly review reminders, and incomplete expenses.
- Re-enabled header notification bell with unread count, mark-all-read, linked notifications, and delete actions.
- Added `weekly_reviews` Supabase migration for weekly completion tracking.
- Added protected `/weekly-review` route, sidebar navigation, and dashboard CTA.
- Weekly Review now summarizes income, expenses, net flow, week-over-week spending change, bill status, completed goals, budget usage, recommended next focus, top categories, completion status, and copyable share text.
- Added protected `/streaks` route and sidebar navigation.
- Financial Streaks now tracks daily brief streak, weekly review streak, monthly close streak, bill completion, savings momentum, and finance awareness.
- Expanded Monthly Update into Monthly Review 2.0 with auto-generated monthly summary, net worth, cash flow, debt payments, unpaid bills, tax-deductible investment contributions, top spending categories, suggested next-month budgets, and copyable monthly summary.
- Added Goal Planning Engine to Savings Goals with required monthly contribution, deadline feasibility, behind/on-track status, funding gap, and suggested monthly allocation.
- Expanded Debt Payoff Planner with avalanche vs snowball strategy selection, extra payment simulation, estimated interest, longest payoff estimate, and avalanche interest-savings comparison.
- Added Cash Flow Simulator to Cash Flow with one-time purchase, monthly income change, monthly expense increase, extra debt payment, scenario 90-day cash, monthly scenario net flow, baseline impact, and risk guidance.
- Added Smart Budget Builder to Budget with last-three-month spending analysis, suggested category limits, current-vs-suggested comparison, and apply-plan workflow.
- Added Financial Health Action Plan with top-three score-improving actions, priority, effort, estimated time, target page links, and local completion tracking.
- Added Subscription & Bill Optimizer to Bills with monthly-equivalent recurring cost, annual recurring cost, high-impact recurring bills, keep/review/cancel decisions, and potential monthly savings estimate.
- Production build passes.

### 2026-05-20

- Added a working dashboard CSV transaction importer that accepts CSV files, normalizes signed amounts into income/expense transactions, inserts rows into Supabase, and refreshes dashboard data.
- Replaced the Bills calendar placeholder with a real 30-day upcoming-bills calendar grouped by due date, including bill amounts, categories, status, and mark-paid actions.
- Persisted Growth Workspace referral invites, money challenge joins/progress, household invites, lifecycle email preferences, trust deletion requests, selected premium tier, and AI coach activity in profile preferences.
- Updated Growth Dashboard cards to reflect persisted growth activity instead of static zero placeholders.
- Updated dependency versions and verified `npm audit --audit-level=moderate` reports zero vulnerabilities.
- Production build passes on Vite 6.4.2.
- Added Vitest with unit coverage for planning utilities and investment valuation.
- Extracted pure investment valuation logic and removed the stale mutual-fund fallback NAV assumption.
- Added dedicated Supabase growth workflow tables with owner-scoped RLS for referrals, challenges, household invites, lifecycle preferences, trust requests, premium selections, and AI coach events.
- Added `docs/RLS_AUDIT.md` and `docs/PRIORITY_PLAN.md` to track the next launch-readiness work.
- Migrated `GrowthWorkspace` to write dedicated growth workflow records while preserving profile preferences as a compatibility mirror.
- Added Playwright smoke tests for public route rendering and anonymous protected-route redirects.
- Extracted transaction CSV parsing/mapping into a typed service with unit coverage.
- Lazy-loaded export-only `html2canvas`, `jspdf`, and `jspdf-autotable` dependencies so they are fetched only when export/share actions run.
- Added user-owned `audit_events` with non-blocking audit logging for CSV imports, bill payments, trust requests, referral/household invites, premium selection, and AI coach activity.
- Added shared `profile-service` and migrated settings/profile preference persistence to typed shared helpers.
