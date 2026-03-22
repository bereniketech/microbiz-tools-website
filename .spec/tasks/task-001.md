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

## Handoff — What Was Done
- Scaffolded Next.js 14 + TypeScript + Tailwind project structure and installed Supabase/shadcn dependencies.
- Implemented Supabase browser/server clients, auth middleware redirect for `/dashboard`, and login/register UI routes.
- Added full `lib/db/schema.sql` with 9 tables + RLS policies and created shared DB types in `types/index.ts`.

## Handoff — Patterns Learned
- Keep Supabase auth pages in a dynamic route group (`app/(auth)/layout.tsx`) to avoid static prerender issues in build.
- Use `(select auth.uid())` in RLS policies for better planner behavior and consistency.
- If interactive CLI setup is interrupted, validate for accidental file concatenation before continuing.

## Handoff — Files Changed
- `package.json`, `package-lock.json`, `.gitignore`
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `app/dashboard/page.tsx`
- `components.json`, `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/input.tsx`, `components/ui/label.tsx`
- `lib/utils.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/db/schema.sql`
- `middleware.ts`, `tailwind.config.ts`, `types/index.ts`, `bug-log.md`

## Status
COMPLETE
