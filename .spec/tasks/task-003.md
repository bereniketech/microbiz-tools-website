# task-003: Dashboard page

## Session Bootstrap
Skills needed: build-website-web-app, postgres-patterns

## Objective
Build the dashboard control centre — a single-request page showing today's priorities, pipeline snapshot, money snapshot, and quick actions with real DB data.

## Implementation Steps
1. Build `app/api/dashboard/route.ts` — single aggregated query returning:
   - follow-ups due today (count + items)
   - tasks due today (count + items)
   - overdue invoices (count + total amount)
   - pipeline counts: leads by status (new/contacted), active deals, closed
   - income: this month earned, pending total
2. Build `app/(dashboard)/page.tsx` — dashboard home using Server Component
3. Build widget components:
   - `components/dashboard/PrioritiesWidget.tsx` — follow-ups, tasks, overdue payments
   - `components/dashboard/PipelineWidget.tsx` — Leads / Active / Closed counts
   - `components/dashboard/MoneyWidget.tsx` — earned + pending
   - `components/dashboard/QuickActions.tsx` — Add Lead, Send Proposal, Create Invoice
4. Add empty states to each widget

## Key Patterns
[greenfield — no existing files to reference]

## Key Code Snippets
(empty — greenfield)

## Acceptance Criteria
- Dashboard loads with a single call to `/api/dashboard` (verify in Network tab — no per-widget requests)
- All widget data reflects real DB records
- Pipeline counts match actual lead/client statuses in DB
- Month-to-date earned = sum of payments.amount where paid_at is in current month
- Empty states render when no data exists

## Handoff
- Tests written: Type-check (`npx.cmd tsc --noEmit`) passes. Build currently fails in this environment due missing/invalid Supabase env at prerender stage and intermittent Next.js `.next` cache state.
- Files changed: `app/api/dashboard/route.ts`, `app/(dashboard)/page.tsx`, `components/dashboard/PrioritiesWidget.tsx`, `components/dashboard/PipelineWidget.tsx`, `components/dashboard/MoneyWidget.tsx`, `components/dashboard/QuickActions.tsx`, `app/globals.css`, `tailwind.config.ts`, `app/(dashboard)/layout.tsx`, `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`
- Notes for next task: Dashboard now fetches all widget data via a single `/api/dashboard` call and includes empty states for each widget. If build validation is required in CI/local, ensure valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are available and run a clean build (`rmdir /s /q .next` before `npm.cmd run build`).
