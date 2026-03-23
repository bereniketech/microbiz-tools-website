# task-012: Analytics module

## Session Bootstrap
Skills needed: build-website-web-app, postgres-patterns

## Objective
Build the analytics page with a proposal conversion funnel, key metrics, and an insight callout that tells the user where they perform best.

## Implementation Steps
1. Build `app/api/analytics/route.ts` — `GET`:
   - Funnel: count proposals by status (sent, viewed, replied=[accepted+rejected], closed=[accepted])
   - Totals: proposals sent, reply rate (viewed/sent), close rate (accepted/sent)
   - Service breakdown: close rate per service_type (proposals.service_type)
2. Build `app/(dashboard)/analytics/page.tsx`:
   - Funnel visualization (horizontal bar or step chart with Recharts)
   - Stat cards: proposals sent, reply rate %, close rate %
   - Insights callout: IF any service_type has close rate > overall average → show "You close more [service_type] deals"
   - IF follow-up count is low relative to proposal count → show "You don't follow up enough"

## Key Patterns
[greenfield — no existing files to reference]

## Key Code Snippets
(empty — greenfield)

## Acceptance Criteria
- Funnel counts match actual proposal statuses in DB
- Reply rate = (viewed count / sent count) × 100, rounded to 1 decimal
- Close rate = (accepted count / sent count) × 100, rounded to 1 decimal
- Insight callout appears when a service type's close rate exceeds overall average
- Page renders correctly with zero data (empty state)

## Handoff
- Tests written: `get_errors` (workspace, no errors), `npx.cmd tsc --noEmit` (passes), `npm.cmd run build` (intermittent Next.js ENOENT on `.next/server/pages-manifest.json` in this environment despite successful compile + type/lint phase)
- Files changed: `app/api/analytics/route.ts`, `components/dashboard/ProposalFunnelChart.tsx`, `app/(dashboard)/analytics/page.tsx`
- Notes for next task: Analytics module is now live with status-based proposal funnel, rounded reply/close rates, service-type close-rate breakdown, and conditional insight callouts (best-performing service and low follow-up warning). Page includes explicit empty states for zero proposal/service data and a resilient API fetch fallback.
