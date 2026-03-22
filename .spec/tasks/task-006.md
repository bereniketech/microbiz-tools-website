# task-006: Follow-up engine

## Session Bootstrap
Skills needed: build-website-web-app, postgres-patterns, api-design

## Objective
Build the follow-up queue — the feature users will open daily. Sorted by urgency, with one-click status updates and snippet-powered follow-up actions.

## Implementation Steps
1. Build `app/api/follow-ups/route.ts` — `GET` returns follow-ups sorted: overdue (due_date < today) → due today → upcoming. `POST` creates follow-up.
2. Build `app/api/follow-ups/[id]/route.ts` — `PATCH` updates status
3. Build `app/(dashboard)/follow-ups/page.tsx` — columns: Overdue, Due Today, Upcoming, Ghosted
4. Build follow-up card component with:
   - Client/lead name
   - Status badge
   - Due date
   - "Follow Up" button → opens snippet picker
   - "Replied" / "Ghosted" quick-action buttons
5. Integrate `SnippetPicker` component (built in task-007 — stub it here, wire after task-007)
6. "Ghosted" items move to a separate collapsed section

## Key Patterns
[greenfield — no existing files to reference]

## Key Code Snippets
(empty — greenfield)

## Acceptance Criteria
- List sorted correctly: overdue first, due today second, upcoming third
- Marking "Replied" removes item from active queue (optimistic update)
- Marking "Ghosted" moves item to ghosted section
- "Follow Up" button opens snippet picker; selecting a snippet copies resolved text to clipboard
- Auto-created follow-ups from lead creation (task-004) and proposal sending (task-008) appear here correctly

## Handoff
- Tests written: `npx.cmd tsc --noEmit`, `next build` (build path has existing environment-related Supabase issues outside this task scope)
- Files changed: `app/api/follow-ups/route.ts`, `app/api/follow-ups/[id]/route.ts`, `app/(dashboard)/follow-ups/page.tsx`, `components/followups/FollowUpCard.tsx`, `components/followups/SnippetPicker.tsx`
- Notes for next task: Replace `SnippetPicker` stub data with task-007 snippet API integration and keep `{client_name}` placeholder resolution + clipboard copy contract unchanged.
