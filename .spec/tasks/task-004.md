# task-004: Leads module

## Session Bootstrap
Skills needed: build-website-web-app, postgres-patterns, api-design

## Objective
Build the leads module: list, quick-add modal, detail page, and one-click convert to client. Auto-create a follow-up on lead creation.

## Implementation Steps
1. Build `app/api/leads/route.ts` — `GET` (list with status filter) + `POST` (create lead + insert follow_up with due_date = today+2)
2. Build `app/api/leads/[id]/route.ts` — `PATCH` (update)
3. Build `app/api/leads/[id]/convert/route.ts` — `POST`: insert into clients, update lead status=converted, migrate follow_ups to new client_id
4. Build `app/(dashboard)/leads/page.tsx` — leads list with status filter tabs
5. Build `components/leads/QuickAddLeadModal.tsx` — 4 fields: name (required), contact (required), service, estimated_value
6. Build `app/(dashboard)/leads/[id]/page.tsx` — lead detail: contact info, status, follow-ups, notes
7. Add Zod validation on POST handler

## Key Patterns
[greenfield — no existing files to reference]

## Key Code Snippets
(empty — greenfield)

## Acceptance Criteria
- Lead saves with name + contact in under 1s; service + value are optional
- Missing name or contact shows inline validation error, form does not submit
- Follow-up with due_date = today+2 is inserted in DB on lead creation
- "Convert to Client" promotes lead to clients table, sets lead.status=converted, preserves all data
- Converted leads do not appear in the active leads list

## Handoff
- Tests written: Type-check passes with `npx.cmd tsc --noEmit`. Build remains environment-dependent due existing Supabase/Next prerender state in this workspace.
- Files changed: `app/api/leads/route.ts`, `app/api/leads/[id]/route.ts`, `app/api/leads/[id]/convert/route.ts`, `app/(dashboard)/leads/page.tsx`, `app/(dashboard)/leads/[id]/page.tsx`, `components/leads/QuickAddLeadModal.tsx`, `components/layout/QuickActionBar.tsx`, `components/layout/Sidebar.tsx`.
- Notes for next task: Leads flow now supports list filters (active excludes converted), quick-add with inline validation, detail updates, and convert-to-client migration of follow-ups. If you validate with live data, confirm the Supabase schema uses `stage` for lead status and `follow_ups.due_at` for due timestamps.
