# task-008: Proposals module

## Session Bootstrap
Skills needed: build-website-web-app, postgres-patterns, api-design

## Objective
Build the proposal system: structured builder with 5 sections, template support, share link with public view, and one-click accept that converts to a deal.

## Implementation Steps
1. Build `app/api/proposals/route.ts` — `GET` (list) + `POST` (create, linked to client)
2. Build `app/api/proposals/[id]/route.ts` — `PATCH` (update)
3. Build `app/api/proposals/[id]/send/route.ts` — `POST`: set status=sent, generate share_token (crypto.randomUUID), auto-create follow_up (due_date = today+3)
4. Build `app/api/proposals/[id]/accept/route.ts` — `POST`: set status=accepted
5. Build `app/api/proposals/view/[token]/route.ts` — public `GET` (no auth middleware): return proposal by share_token, record viewed_at if first view
6. Build `app/(dashboard)/proposals/page.tsx` — list with status filter
7. Build `app/(dashboard)/proposals/new/page.tsx` — builder: client picker, 5 section fields, template picker, save/send buttons
8. Build `app/(dashboard)/proposals/[id]/page.tsx` — view/edit + Send + Download PDF actions
9. Build `app/proposals/view/[token]/page.tsx` — public view (outside dashboard layout) with Accept button
10. Add `is_template` toggle: saving as template adds to template picker

## Key Patterns
[greenfield — no existing files to reference]

## Key Code Snippets
(empty — greenfield)

## Acceptance Criteria
- Builder saves all 5 sections (Problem, Solution, Scope, Timeline, Pricing) linked to a client
- Sending sets status=sent, generates share_token, creates follow-up task due today+3
- Public share link opens proposal view page without requiring login
- First view of share link records viewed_at timestamp in DB
- Clicking Accept on public page sets proposal status=accepted
- Template picker pre-fills builder from selected template

## Handoff
- Tests written: <!-- /task-handoff fills this -->
- Files changed: <!-- /task-handoff fills this -->
- Notes for next task: <!-- /task-handoff fills this -->
