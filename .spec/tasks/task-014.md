# task-014: Final integration + deployment

## Session Bootstrap
Skills needed: build-website-web-app, security-review, tdd-workflow

## Objective
Security audit, full E2E smoke test of the lead-to-payment workflow, Vercel deployment, and GitHub remote setup.

## Implementation Steps
1. **Security review — OWASP checklist:**
   - Auth: all dashboard routes protected by middleware, no auth bypass possible
   - RLS: verify every table policy with a cross-user query test
   - Input validation: confirm Zod schemas on all POST/PATCH handlers
   - Secrets: confirm no env vars exposed in client bundle (`NEXT_PUBLIC_` only for safe keys)
   - Public routes: only `/api/proposals/view/:token` and `/proposals/view/:token` are unauthenticated — verify
   - share_token: confirm it's crypto.randomUUID(), not predictable

2. **E2E smoke test** (manual or Playwright):
   - Register new user → log in
   - Add lead → verify follow-up auto-created
   - Convert lead to client → verify data preserved
   - Create proposal → send → verify share link works → accept
   - Create invoice → mark paid → verify income tracker updates
   - Check dashboard shows correct counts

3. **Vercel deployment:**
   - `npm run build` passes
   - Add all env vars to Vercel project settings (from `.env.example`)
   - Deploy via Vercel CLI or GitHub integration
   - Verify live URL works end-to-end

4. **GitHub remote:**
   - `git remote add origin https://github.com/bereniketech/microbiz-tools-website.git`
   - `git add .` (exclude `.env`)
   - `git commit -m "feat: initial build — full microbiz toolbox"`
   - `git push -u origin main`

## Key Patterns
[greenfield — no existing files to reference]

## Key Code Snippets
(empty — greenfield)

## Acceptance Criteria
- OWASP checklist passes: no critical auth, injection, or secrets issues found
- Full lead → proposal → invoice → payment workflow completes on production URL without errors
- `npm run build` exits 0 with no TypeScript errors
- Vercel deployment is live with all env vars set
- GitHub remote is connected and main branch is up to date

## Handoff
- Tests written: <!-- /task-handoff fills this -->
- Files changed: <!-- /task-handoff fills this -->
- Notes for next task: <!-- /task-handoff fills this -->
