# task-011: Income tracker

## Session Bootstrap
Skills needed: build-website-web-app, postgres-patterns

## Objective
Build the income tracker page showing monthly earned, pending, and a 6-month line chart. Data must update immediately when an invoice is marked paid.

## Implementation Steps
1. Build `app/api/income/route.ts` — `GET`:
   - This month: SUM(payments.amount) where paid_at in current month
   - Pending: SUM(invoices.total) where status=pending
   - History: monthly totals for last 6 months (group by month)
2. Build `app/(dashboard)/income/page.tsx`:
   - Stat cards: "Earned this month" + "Pending"
   - Line chart using Recharts (`npm install recharts`) — 6 months of income
3. Use Next.js `revalidatePath('/income')` after mark-paid action (task-009) to bust cache

## Key Patterns
[greenfield — no existing files to reference]

## Key Code Snippets
(empty — greenfield)

## Acceptance Criteria
- "Earned this month" = sum of payments.amount where paid_at in current calendar month
- "Pending" = sum of invoices.total where status=pending
- Line chart shows correct monthly totals for the last 6 months
- After marking an invoice paid (task-009), income page reflects the new total on next load (no stale data)

## Handoff
- Tests written: `npx.cmd tsc --noEmit` (pass), `npm.cmd run build` (fails in this environment with intermittent Next.js ENOENT on `.next/server/pages-manifest.json` after compile)
- Files changed: `app/api/income/route.ts`, `app/(dashboard)/income/page.tsx`, `components/dashboard/IncomeHistoryChart.tsx`, `app/(dashboard)/invoices/new/page.tsx`, `package.json`, `package-lock.json`
- Notes for next task: Income page now reads from `/api/income` and pay endpoint already calls `revalidatePath('/income')`; if build ENOENT recurs, clear `.next` and rerun build in a clean terminal session.
