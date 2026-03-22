# task-005: Client profile page

## Session Bootstrap
Skills needed: build-website-web-app, postgres-patterns

## Objective
Build the most important screen — a single client profile page that shows all related data: contact info, deals, proposals, invoices, payment status, notes, and a full activity timeline.

## Implementation Steps
1. Build `app/api/clients/[id]/route.ts` — `GET` fetches client with all relations: proposals, invoices, payments, tasks, follow_ups
2. Build `app/(dashboard)/leads/[id]/page.tsx` upgrade → or create `app/(dashboard)/clients/[id]/page.tsx`
3. Build sections:
   - Contact info (name, email, phone, company) with inline edit
   - Active deals (proposals with status=accepted)
   - Proposals list (status badges)
   - Invoices list (status badges + amounts)
   - Payment status summary
   - Notes (text input → saves to clients.notes + activity timeline entry)
   - Activity timeline (chronological: lead created, converted, proposals sent, invoices sent, payments received, notes added)
4. Compute and display client value (SUM of payments for this client)
5. Show "Cold Client" badge when last_contact_at > 30 days ago
6. Update last_contact_at when a note is added

## Key Patterns
[greenfield — no existing files to reference]

## Key Code Snippets
(empty — greenfield)

## Acceptance Criteria
- All related data (proposals, invoices, tasks, follow-ups) appears on one page
- Client value = sum of paid invoice amounts for this client
- Cold client badge visible when last_contact_at > 30 days ago
- Adding a note saves immediately and appears in timeline with timestamp
- Timeline is sorted newest-first

## Handoff
- Tests written: <!-- /task-handoff fills this -->
- Files changed: <!-- /task-handoff fills this -->
- Notes for next task: <!-- /task-handoff fills this -->
