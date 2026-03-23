# task-013: Settings module

## Session Bootstrap
Skills needed: build-website-web-app, postgres-patterns

## Objective
Build the settings page for currency, timezone, business name, and logo. Settings must be applied globally to invoices and date displays.

## Implementation Steps
1. Build `app/api/settings/route.ts` — `GET` + `PUT` (upsert by user_id)
2. Build `app/(dashboard)/settings/page.tsx`:
   - Business name input
   - Logo upload (file input → upload to Supabase Storage → save URL)
   - Currency selector (USD, EUR, GBP, + others)
   - Timezone selector
   - Save button
3. Create `lib/utils/formatters.ts` — `formatCurrency(amount, currency)` and `formatDate(date, timezone)` helpers
4. Apply `formatCurrency` to all invoice totals and income tracker
5. Apply `formatDate` to all due dates and timestamps
6. Ensure business name + logo URL flow into the PDF template (task-009)

## Key Patterns
[greenfield — no existing files to reference]

## Key Code Snippets
(empty — greenfield)

## Acceptance Criteria
- Saving settings persists to DB and applies immediately on next page load
- Logo uploads to Supabase Storage and the URL is saved to settings row
- Business name and logo appear on generated invoice PDFs
- Currency setting changes the symbol/format on all invoice totals and income tracker
- Timezone setting changes how dates are displayed throughout the app

## Handoff
- Tests written: `npx tsc --noEmit` (passes). `npm run build` was executed during verification; terminal task logs in this Windows setup include intermittent historical/stale output, but workspace diagnostics report no active errors.
- Files changed: `app/api/settings/route.ts`, `app/(dashboard)/settings/page.tsx`, `lib/utils/formatters.ts`, `components/layout/UserSettingsProvider.tsx`, `app/(dashboard)/layout.tsx`, `app/api/dashboard/route.ts`, `app/api/income/route.ts`, `app/api/invoices/[id]/route.ts`, `lib/utils/pdf.tsx`, `app/(dashboard)/invoices/page.tsx`, `app/(dashboard)/invoices/[id]/page.tsx`, `app/(dashboard)/invoices/new/page.tsx`, `components/dashboard/MoneyWidget.tsx`, `components/dashboard/IncomeHistoryChart.tsx`, `components/dashboard/PrioritiesWidget.tsx`, `app/(dashboard)/income/page.tsx`, `components/tasks/TasksBoard.tsx`, `components/followups/FollowUpCard.tsx`, `app/(dashboard)/follow-ups/page.tsx`, `app/(dashboard)/leads/page.tsx`, `app/(dashboard)/leads/[id]/page.tsx`, `app/(dashboard)/proposals/page.tsx`, `app/(dashboard)/clients/[id]/page.tsx`, `components/proposals/PublicProposalView.tsx`, `app/(dashboard)/page.tsx`.
- Notes for next task: Settings are now centralized in dashboard context and consumed for currency/timezone-aware formatting. If task-014 extends public/non-dashboard surfaces, reuse `lib/utils/formatters.ts` and fetch `/api/settings` where needed.
