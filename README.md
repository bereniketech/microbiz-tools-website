# MicroBiz Toolbox

A freelancer workflow web app that connects every step from **lead capture → proposal → invoice → payment** in one unified system — no spreadsheets, no disconnected tools.

## What It Does

| Module | Purpose |
|---|---|
| Dashboard | Today's priorities, pipeline snapshot, money snapshot — know what to do in 5 seconds |
| Leads & Clients | Add leads fast, convert to clients one-click, full client profile with activity timeline |
| Follow-Ups | Urgency-sorted queue of who to contact today — powered by snippets |
| Proposals | Structured builder (Problem → Solution → Scope → Timeline → Pricing), share link, one-click accept |
| Invoices | Line item builder, auto-totals, PDF export, mark-paid flow |
| Tasks | Client-linked tasks with auto-creation on proposal send / invoice send |
| Income Tracker | Monthly earned, pending, 6-month chart |
| Snippets | Reusable message templates with `{client_name}` substitution |
| Analytics | Conversion funnel, close rate by service type, actionable insights |
| Settings | Currency, timezone, branding for PDFs |

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Database & Auth:** Supabase (PostgreSQL + RLS)
- **Hosting:** Vercel
- **PDF:** react-pdf
- **Charts:** Recharts
- **Package Manager:** npm

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Fill in your Supabase and other keys in .env

# 3. Apply database migrations
# Run .spec/design.md ERD schema in your Supabase SQL editor
# (full migration file: lib/db/schema.sql — created in task-001)

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

See [.env.example](.env.example) for all required variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXTAUTH_SECRET
NEXTAUTH_URL
```

## Project Structure

```
microbiz-tools-website/
├── app/
│   ├── (auth)/          # Login, register
│   ├── (dashboard)/     # All protected pages
│   └── api/             # API route handlers
├── components/          # UI components by module
├── lib/
│   ├── supabase/        # Client + server Supabase helpers
│   ├── db/              # Schema + migrations
│   └── utils/           # PDF, email, formatters
├── types/               # Shared TypeScript types
└── .spec/               # Planning artifacts (requirements, design, tasks)
```

## Implementation Plan

14 tasks, fully specced in [.spec/tasks/](.spec/tasks/):

1. `task-001` — Project scaffolding + Supabase setup
2. `task-002` — App shell: layout, sidebar, quick action bar
3. `task-003` — Dashboard page
4. `task-004` — Leads module
5. `task-005` — Client profile page
6. `task-006` — Follow-up engine
7. `task-007` — Snippets module
8. `task-008` — Proposals module
9. `task-009` — Invoices module
10. `task-010` — Tasks module
11. `task-011` — Income tracker
12. `task-012` — Analytics module
13. `task-013` — Settings module
14. `task-014` — Final integration + deployment

## Core Principle

Every module is connected. A lead becomes a client. A client gets a proposal. A proposal turns into an invoice. A payment updates the income tracker. If any link in that chain breaks, the product fails its purpose.
