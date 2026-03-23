# task-009: Invoices module

## Session Bootstrap
Skills needed: build-website-web-app, postgres-patterns, api-design

## Objective
Build the invoice system: line item builder with auto-totals, status tracking, mark-paid flow that feeds the income tracker, and PDF export.

## Implementation Steps
1. Build `app/api/invoices/route.ts` — `GET` (list, filterable by status) + `POST` (create, auto-create payment-check task)
2. Build `app/api/invoices/[id]/route.ts` — `PATCH` (update status, items)
3. Build `app/api/invoices/[id]/pay/route.ts` — `POST`: set status=paid, insert into payments, auto-close payment-check task
4. Build `app/(dashboard)/invoices/page.tsx` — list with Paid / Pending / Overdue filter tabs
5. Build `app/(dashboard)/invoices/new/page.tsx` — line item builder:
   - Add/remove line items (name, qty, unit price)
   - Tax rate input (%)
   - Auto-computed: subtotal, tax amount, total
   - Client picker, due date, currency (from settings)
6. Build `app/(dashboard)/invoices/[id]/page.tsx` — invoice detail + Mark Paid + Download PDF
7. Build `lib/utils/pdf.ts` — react-pdf template for invoice (branding from settings)
8. Add cron-like check: query invoices where status=pending AND due_date < today-7 → set overdue (run on dashboard load as a background call)

## Key Patterns
[greenfield — no existing files to reference]

## Key Code Snippets
(empty — greenfield)

## Acceptance Criteria
- Line items calculate subtotal + tax + total correctly (test with multiple items and non-zero tax)
- Invoice status changes to Overdue when 7 days past due_date
- "Mark Paid" inserts payment row and immediately reflects in income tracker
- PDF download produces a document showing line items, totals, and business branding
- Payment-check task appears in tasks list after invoice creation

## Handoff
- Tests written: `get_errors` on changed task-009 files; `npx.cmd tsc --noEmit`; `npm.cmd run build` (via task + terminal run)
- Files changed: `app/api/invoices/route.ts`, `app/api/invoices/[id]/route.ts`, `app/api/invoices/[id]/pay/route.ts`, `app/api/invoices/defaults/route.ts`, `app/api/invoices/overdue-sync/route.ts`, `app/(dashboard)/invoices/page.tsx`, `app/(dashboard)/invoices/new/page.tsx`, `app/(dashboard)/invoices/[id]/page.tsx`, `components/dashboard/OverdueInvoiceSync.tsx`, `app/(dashboard)/page.tsx`, `app/api/dashboard/route.ts`, `app/(dashboard)/tasks/page.tsx`, `lib/invoice-schemas.ts`, `lib/db/schema.sql`, `types/index.ts`, `lib/utils/index.ts`, `lib/utils/pdf.tsx`, `package.json`, `package-lock.json`
- Notes for next task: Invoice flow now auto-creates payment-check tasks on create and auto-closes matching task on mark-paid; overdue status is promoted by a background dashboard-triggered sync (`/api/invoices/overdue-sync`); invoice detail PDF generation uses `@react-pdf/renderer` template in `lib/utils/pdf.tsx`.
