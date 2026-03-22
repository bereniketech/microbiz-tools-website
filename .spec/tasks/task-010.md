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
- Tests written: <!-- /task-handoff fills this -->
- Files changed: <!-- /task-handoff fills this -->
- Notes for next task: <!-- /task-handoff fills this -->
