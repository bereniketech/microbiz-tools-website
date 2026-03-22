# task-001: Project scaffolding + Supabase setup

## Session Bootstrap
Skills needed: build-website-web-app, postgres-patterns, database-migrations

## Objective
Initialise the Next.js 14 project with full TypeScript + Tailwind + shadcn/ui setup, configure Supabase auth and database, write all table migrations with RLS, and add login/register pages.

## Implementation Steps
1. Run `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"`
2. Install dependencies: `npm install @supabase/supabase-js @supabase/ssr zod`
3. Install shadcn/ui: `npx shadcn@latest init`
4. Create `lib/supabase/client.ts` (browser client) and `lib/supabase/server.ts` (server client)
5. Create `middleware.ts` — refresh session + redirect unauthenticated users to `/login`
6. Write `lib/db/schema.sql` — all 9 tables (leads, clients, proposals, invoices, payments, follow_ups, tasks, snippets, settings) with RLS policies
7. Apply migration in Supabase dashboard (SQL editor)
8. Create `app/(auth)/login/page.tsx` — email/password sign in form
9. Create `app/(auth)/register/page.tsx` — email/password sign up form
10. Create `types/index.ts` — TypeScript types for all DB tables

## Key Patterns
[greenfield — no existing files to reference]

## Key Code Snippets
(empty — greenfield)

## Acceptance Criteria
- `npm run build` passes with zero TypeScript errors
- Unauthenticated requests to `/dashboard` redirect to `/login`
- Authenticated user can register, log in, and session persists on refresh
- All 9 tables exist in Supabase with RLS enabled — a query with a different user_id returns 0 rows

## Handoff
- Tests written: <!-- /task-handoff fills this -->
- Files changed: <!-- /task-handoff fills this -->
- Notes for next task: <!-- /task-handoff fills this -->
