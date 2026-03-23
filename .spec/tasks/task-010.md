# task-010: Tasks module

## Session Bootstrap
Skills needed: build-website-web-app, postgres-patterns

## Objective
Build the tasks module. Tasks are linked to clients, have priorities and due dates, and auto-tasks from proposals/invoices must appear here correctly.

## Implementation Steps
1. Build `app/api/tasks/route.ts` — `GET` (list, filterable by status/client) + `POST` (create)
2. Build `app/api/tasks/[id]/route.ts` — `PATCH` (update, complete)
3. On task completion: record activity timeline entry on linked client (if client_id set)
4. Build `app/(dashboard)/tasks/page.tsx`:
   - Sections: Overdue, Due Today, Upcoming, Completed
   - Each task shows: title, linked client name (clickable), priority badge, due date
   - Overdue tasks visually flagged (red border or badge)
   - One-click complete button
5. Build task creation form (inline or modal): title, client (optional), priority, due date

## Key Patterns
[greenfield — no existing files to reference]

## Key Code Snippets
(empty — greenfield)

## Acceptance Criteria
- Tasks can be created with or without a client link
- Tasks past due_date are visually flagged as overdue
- Completing a task sets status=completed and records an event in the linked client's activity timeline
- Auto-tasks created by proposals (task-008) and invoices (task-009) appear in this list correctly
- Completed tasks move out of active sections

## Handoff
- Tests written: `get_errors` on changed task-010 files; `npx.cmd tsc --noEmit`; `npm.cmd run build` (lint command is not yet usable because Next.js prompts for initial ESLint setup and the generated dependency pair conflicts on this repo state)
- Files changed: `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`, `app/(dashboard)/tasks/page.tsx`, `components/tasks/TasksBoard.tsx`, `lib/task-schemas.ts`, `lib/tasks.ts`, `app/api/proposals/[id]/send/route.ts`, `app/api/proposals/[id]/accept/route.ts`, `app/api/invoices/route.ts`, `app/api/invoices/[id]/pay/route.ts`, `app/api/dashboard/route.ts`, `app/api/clients/[id]/route.ts`, `components/ui/button.tsx`, `bug-log.md`
- Notes for next task: Tasks now load through dedicated `/api/tasks` routes with grouped dashboard UI, manual create/complete flows, client timeline logging on completion, invoice payment-check tasks normalized to `completed`, and proposal send/accept now create and close a matching proposal follow-up task so task automation appears in the tasks module consistently.
