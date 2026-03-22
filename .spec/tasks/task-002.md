# task-002: App shell — layout, sidebar, quick action bar

## Session Bootstrap
Skills needed: build-website-web-app, code-writing-software-development

## Objective
Build the persistent dashboard shell: left sidebar with all nav links, top bar with universal search, and a quick action bar for adding leads/invoices/proposals from anywhere.

## Implementation Steps
1. Create `app/(dashboard)/layout.tsx` — wraps all dashboard pages with sidebar + topbar
2. Create `components/layout/Sidebar.tsx` — nav links: Dashboard, Leads & Clients, Follow-Ups, Proposals, Invoices, Tasks, Income, Snippets, Analytics, Settings
3. Create `components/layout/TopBar.tsx` — search input + user avatar/logout
4. Create `components/layout/QuickActionBar.tsx` — Add Lead, Create Invoice, Send Proposal buttons
5. Build `app/api/search/route.ts` — `GET ?q=` queries clients, proposals, invoices with `ILIKE`
6. Wire search input to `/api/search` with debounce (300ms), display grouped results dropdown
7. Add mobile responsive behaviour — sidebar collapses to hamburger at <768px

## Key Patterns
[greenfield — no existing files to reference]

## Key Code Snippets
(empty — greenfield)

## Acceptance Criteria
- All 10 sidebar links render and navigate to the correct routes
- Search queries `/api/search?q=` and shows results grouped by Clients / Proposals / Invoices
- QuickActionBar Add Lead opens a modal; Create Invoice and Send Proposal navigate to `/invoices/new` and `/proposals/new`
- Layout renders correctly at 375px (mobile) and 1280px (desktop)

## Handoff
- Tests written: <!-- /task-handoff fills this -->
- Files changed: <!-- /task-handoff fills this -->
- Notes for next task: <!-- /task-handoff fills this -->
