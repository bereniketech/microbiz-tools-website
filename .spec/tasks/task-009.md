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
- Tests written: <!-- /task-handoff fills this -->
- Files changed: <!-- /task-handoff fills this -->
- Notes for next task: <!-- /task-handoff fills this -->
