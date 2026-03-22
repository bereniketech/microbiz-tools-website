# task-007: Snippets module

## Session Bootstrap
Skills needed: build-website-web-app, postgres-patterns

## Objective
Build the snippets library and a reusable snippet picker component. Snippets support `{client_name}` variable substitution and are used across follow-ups and proposals.

## Implementation Steps
1. Build `app/api/snippets/route.ts` — `GET` (list, filterable by category) + `POST` (create)
2. Build `app/api/snippets/[id]/route.ts` — `PATCH` (update) + `DELETE`
3. Build `app/(dashboard)/snippets/page.tsx` — list with category filter tabs, create/edit form
4. Build `components/snippets/SnippetPicker.tsx` — modal/popover:
   - Search input
   - Category filter
   - List of snippets
   - On select: replace `{client_name}` with provided clientName prop, copy to clipboard, call onInsert callback
5. Export `SnippetPicker` for use in follow-ups (task-006) and proposals (task-008)

## Key Patterns
[greenfield — no existing files to reference]

## Key Code Snippets
(empty — greenfield)

## Acceptance Criteria
- Snippets save with title, body, and optional category
- `{client_name}` in body is replaced with actual client name on insertion
- Snippet picker filters by category correctly
- Selecting a snippet in follow-up context copies resolved text to clipboard
- SnippetPicker component is reusable (accepts `clientName` and `onInsert` props)

## Handoff
- Tests written: <!-- /task-handoff fills this -->
- Files changed: <!-- /task-handoff fills this -->
- Notes for next task: <!-- /task-handoff fills this -->
