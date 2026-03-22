# MicroBiz Toolbox — Implementation Tasks

## Task List

---

### task-001: Project scaffolding + Supabase setup
_Requirements:_ AUTH-1
_Skills:_ build-website-web-app, postgres-patterns, database-migrations

- Initialise Next.js 14 app with TypeScript + Tailwind + shadcn/ui
- Install and configure Supabase client (server + browser)
- Create Supabase project, enable Auth (email/password)
- Write initial DB migration: all tables + RLS policies
- Configure middleware for auth-protected routes
- Add `/login` and `/register` pages with Supabase Auth forms

**AC:**
- `npx next build` passes with zero type errors
- Unauthenticated requests to `/dashboard` redirect to `/login`
- Authenticated user can register, log in, and session persists on refresh
- All tables exist in Supabase with RLS enabled and user isolation verified

---

### task-002: App shell — layout, sidebar, quick action bar
_Requirements:_ DASH-1, SEARCH-1
_Skills:_ build-website-web-app, code-writing-software-development

- Build dashboard layout with left sidebar (all nav items)
- Add TopBar with universal search input (wired to `/api/search`)
- Add QuickActionBar (Add Lead, Create Invoice, Send Proposal)
- Implement responsive layout (sidebar collapses on mobile)

**AC:**
- All sidebar links render and navigate correctly
- Search bar queries `/api/search?q=` and displays results grouped by type
- QuickActionBar actions open correct modals or navigate to correct pages
- Layout renders correctly on mobile (375px) and desktop (1280px)

---

### task-003: Dashboard page
_Requirements:_ DASH-1
_Skills:_ build-website-web-app, postgres-patterns

- Build `/api/dashboard` endpoint (single aggregated query)
- Build dashboard page: Today's priorities, Pipeline snapshot, Money snapshot, Quick actions
- Wire all widgets to live data
- Add empty states for each widget

**AC:**
- Dashboard loads in a single API call (no per-widget waterfall)
- Follow-ups due today, tasks due, overdue payments all reflect real DB data
- Pipeline counts (Leads / Active / Closed) are accurate
- Month-to-date earned and pending totals are correct
- Quick action buttons navigate/open correctly

---

### task-004: Leads module
_Requirements:_ LEAD-1, LEAD-2
_Skills:_ build-website-web-app, postgres-patterns, api-design

- Build `POST /api/leads` — create lead + auto-create follow-up (due in 2 days)
- Build `GET /api/leads` — list with status filter
- Build `POST /api/leads/:id/convert` — convert to client
- Build leads list page with quick-add modal (4 fields)
- Build lead detail page

**AC:**
- Lead saves in <1s with name + contact; service + value optional
- Missing required fields show inline validation errors
- Follow-up is auto-created with due_date = today + 2 days on lead creation
- "Convert to Client" one-click promotes lead, preserves all data, hides from leads list

---

### task-005: Client profile page
_Requirements:_ CLIENT-1
_Skills:_ build-website-web-app, postgres-patterns

- Build `GET /api/clients/:id` — fetch client with proposals, invoices, tasks, follow-ups, payments
- Build client profile page: contact info, deals, proposals, invoices, payment status, notes, activity timeline
- Add client value total (sum of paid invoices)
- Add "cold client" flag (last_contact_at > 30 days)
- Add note creation (appends to activity timeline)

**AC:**
- All related data renders on one page with no extra navigation
- Client value total matches sum of paid invoices
- Cold client badge appears when last_contact_at > 30 days ago
- Adding a note saves it and shows it in the timeline with timestamp

---

### task-006: Follow-up engine
_Requirements:_ FOLLOW-1
_Skills:_ build-website-web-app, postgres-patterns, api-design

- Build `GET /api/follow-ups` — sorted: overdue → due today → upcoming
- Build `PATCH /api/follow-ups/:id` — update status
- Build follow-ups page with status columns
- Integrate snippet picker into "Follow Up" action
- Auto-create follow-up when proposal is sent (wired in task-008)

**AC:**
- List is sorted correctly: overdue first, then due today, then upcoming
- Marking "Replied" removes item from active queue immediately
- Marking "Ghosted" moves item to ghosted view
- Snippet picker opens on "Follow Up" click and inserts selected snippet text

---

### task-007: Snippets module
_Requirements:_ SNIP-1
_Skills:_ build-website-web-app, postgres-patterns

- Build CRUD API for snippets (`GET`, `POST`, `PATCH /api/snippets`)
- Build snippets page with category filter
- Build snippet picker component (reusable, used in follow-ups)
- Implement `{client_name}` variable substitution on insert

**AC:**
- Snippets save with title, body, category
- `{client_name}` is replaced with actual client name when snippet is inserted in a follow-up context
- Snippet picker filters by category
- Inserting a snippet copies full resolved text to clipboard

---

### task-008: Proposals module
_Requirements:_ PROP-1, PROP-2
_Skills:_ build-website-web-app, postgres-patterns, api-design

- Build proposal CRUD API (`GET`, `POST`, `PATCH`)
- Build `POST /api/proposals/:id/send` — set status=sent, generate share_token, auto-create follow-up task (due +3 days)
- Build `POST /api/proposals/:id/accept` — set status=accepted
- Build `GET /api/proposals/view/:token` — public view (no auth)
- Build proposal builder page (5 sections + template picker)
- Build public proposal view page with Accept button
- Build proposal list page

**AC:**
- Proposal builder saves all 5 sections linked to a client
- Sending a proposal sets status=sent and creates a follow-up task
- Share link opens public view without auth
- Viewing share link records viewed_at timestamp
- Accepting proposal sets status=accepted
- Template picker pre-fills builder from saved templates

---

### task-009: Invoices module
_Requirements:_ INV-1, INV-2
_Skills:_ build-website-web-app, postgres-patterns, api-design

- Build invoice CRUD API (`GET`, `POST`, `PATCH`)
- Build `POST /api/invoices/:id/pay` — mark paid, insert payment row, update income
- Build invoice creation page: line items, tax, discount, auto-total
- Build invoice list page with Paid / Pending / Overdue filter
- Build PDF download (react-pdf)
- Auto-create payment-check task on invoice creation

**AC:**
- Line items calculate subtotal + tax + total correctly
- Invoice status auto-changes to Overdue when past due_date by 7 days
- "Mark Paid" records payment and immediately updates income tracker
- PDF download produces correctly branded document
- Payment-check task is auto-created on invoice creation

---

### task-010: Tasks module
_Requirements:_ TASK-1
_Skills:_ build-website-web-app, postgres-patterns

- Build task CRUD API (`GET`, `POST`, `PATCH`)
- Build tasks page: grouped by status, linked client shown
- Tasks overdue flagged visually
- Complete task → removed from active list, recorded in client timeline

**AC:**
- Tasks can be created with or without client link
- Overdue tasks are visually flagged (past due_date)
- Completing a task updates status=completed and records event in client activity timeline
- Auto-tasks from proposals and invoices appear in the task list correctly

---

### task-011: Income tracker
_Requirements:_ INCOME-1
_Skills:_ build-website-web-app, postgres-patterns

- Build `GET /api/income` — monthly totals + 6-month history
- Build income page: earned this month, pending, line chart (Recharts)

**AC:**
- Earned and pending totals match payment records
- Line chart shows correct monthly totals for last 6 months
- Totals update within 1s of marking an invoice paid (no stale cache)

---

### task-012: Analytics module
_Requirements:_ ANALYTICS-1
_Skills:_ build-website-web-app, postgres-patterns

- Build `GET /api/analytics` — funnel metrics + service type breakdown
- Build analytics page: conversion funnel, proposal stats, insights callout

**AC:**
- Funnel shows correct counts: Sent → Viewed → Replied → Closed
- Reply rate and close rate are calculated correctly
- Insight callout appears when one service type has above-average close rate

---

### task-013: Settings module
_Requirements:_ SETTINGS-1
_Skills:_ build-website-web-app, postgres-patterns

- Build settings CRUD API (`GET`, `PUT /api/settings`)
- Build settings page: currency, timezone, business name, logo upload (Supabase Storage)
- Apply currency to invoice totals; apply timezone to date displays

**AC:**
- Saving settings persists immediately and applies to all invoice/date renders
- Logo upload stores file in Supabase Storage and saves URL to settings row
- Business name and logo appear on generated PDF invoices

---

### task-014: Final integration + deployment
_Requirements:_ All
_Skills:_ build-website-web-app, security-review, tdd-workflow

- Run full security review (OWASP checklist: auth, input validation, RLS, secrets)
- Run E2E smoke test: register → add lead → convert → send proposal → create invoice → mark paid → check dashboard
- Configure Vercel deployment (env vars, domain)
- Connect GitHub remote and push

**AC:**
- OWASP Top 10 checklist passes with no critical issues
- Full lead-to-payment workflow completes without errors in production
- Vercel deployment succeeds with all env vars configured
- GitHub remote is connected and main branch is pushed
