# Plan: MicroBiz Toolbox

## Goal
Build a freelancer workflow web app that connects lead capture → proposals → invoicing → payment tracking in one unified system.

## Constraints
- Next.js (React) + TypeScript
- Supabase (auth + PostgreSQL)
- Deployed on Vercel
- npm as package manager
- No breaking the lead → deal → payment flow — all modules must be connected

## Deliverables
The plan must produce:
- `.spec/plan.md` — high-level project overview: goal, tech stack, architecture diagram, file structure
- `.spec/requirements.md` — user stories and acceptance criteria (EARS format)
- `.spec/design.md` — architecture, data models, API design, ADRs, security, performance
- `.spec/tasks.md` — ordered task list with acceptance criteria per task

## Instructions
Use /planning-specification-architecture.
Write `plan.md` first as the high-level overview, then follow the skill's 3-phase gated workflow: requirements → user approves → design → user approves → tasks → user approves.
Do not write implementation code. Do not skip approval gates.
Save each artifact only after the user explicitly approves that phase.
