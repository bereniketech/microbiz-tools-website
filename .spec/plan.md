# MicroBiz Toolbox — Project Plan

## Goal
A single web application that takes a freelancer from **lead capture → proposal → invoice → payment tracking → repeat**, replacing disconnected spreadsheets and tools with one connected workflow.

## Target User
Freelancers and solo service providers who need to manage clients, close deals, and get paid — without the complexity of enterprise CRMs.

## Core Principle
Every module is connected. A lead becomes a client. A client gets a proposal. A proposal turns into an invoice. A payment updates the income tracker. If any link breaks, the product fails.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | SSR, API routes, file-based routing |
| UI | Tailwind CSS + shadcn/ui | Fast, accessible, composable components |
| Database | Supabase (PostgreSQL) | Auth + DB + real-time in one service |
| Auth | Supabase Auth | Built-in with RLS for per-user data isolation |
| Hosting | Vercel | Zero-config Next.js deployment |
| Package Manager | npm | Project standard |
| PDF Generation | react-pdf or puppeteer | Proposal/invoice export |
| Email | Resend | Transactional email (follow-ups, reminders) |

---

## Architecture Diagram

```mermaid
graph TD
    User -->|Auth| SupabaseAuth
    User --> Dashboard
    Dashboard --> Leads
    Dashboard --> FollowUps
    Dashboard --> Proposals
    Dashboard --> Invoices
    Dashboard --> Tasks
    Dashboard --> Income
    Dashboard --> Snippets
    Dashboard --> Analytics

    Leads -->|convert| Clients
    Clients --> Proposals
    Proposals -->|accept| Deals
    Deals --> Invoices
    Invoices --> Payments
    Payments --> Income

    subgraph Next.js App Router
        Dashboard
        Leads
        Clients
        Proposals
        Invoices
        Tasks
        Income
        Snippets
        Analytics
        FollowUps
    end

    subgraph Supabase
        SupabaseAuth
        PostgreSQL[(PostgreSQL)]
        RLS[Row Level Security]
    end

    Next.js App Router -->|API Routes| PostgreSQL
    PostgreSQL --> RLS
```

---

## File & Folder Structure

```
microbiz-tools-website/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + global nav
│   │   ├── page.tsx                # Dashboard home
│   │   ├── leads/
│   │   │   ├── page.tsx            # Leads list
│   │   │   └── [id]/page.tsx       # Lead / Client profile
│   │   ├── follow-ups/page.tsx
│   │   ├── proposals/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── tasks/page.tsx
│   │   ├── income/page.tsx
│   │   ├── snippets/page.tsx
│   │   ├── analytics/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       ├── leads/route.ts
│       ├── clients/route.ts
│       ├── proposals/route.ts
│       ├── invoices/route.ts
│       ├── follow-ups/route.ts
│       ├── tasks/route.ts
│       ├── income/route.ts
│       └── snippets/route.ts
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── QuickActionBar.tsx
│   ├── leads/
│   ├── proposals/
│   ├── invoices/
│   ├── follow-ups/
│   ├── tasks/
│   ├── income/
│   ├── snippets/
│   └── analytics/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── db/
│   │   └── schema.sql              # Supabase migrations
│   └── utils/
│       ├── pdf.ts
│       ├── email.ts
│       └── formatters.ts
├── types/
│   └── index.ts                    # Shared TypeScript types
├── .claude/
├── .spec/
├── .env
├── .env.example
├── .gitignore
└── package.json
```

---

## Module Breakdown

### 1. Dashboard (Control Center)
- Today's priorities: follow-ups due, tasks due, overdue payments
- Pipeline snapshot: Leads → Active → Closed counts
- Money snapshot: this month earned, pending
- Quick actions: add lead, send proposal, create invoice

### 2. Leads & Clients
- Add lead in <5 seconds (name, contact, service, estimated value)
- One-click convert lead → client
- Client profile: contact info, deals, proposals, invoices, payment status, notes, activity timeline
- Smart flags: client value, last contact, cold client

### 3. Follow-Up Engine
- Status system: Waiting / Follow-up due / Replied / Ghosted
- Auto follow-up suggestions based on last contact + deal stage
- Priority sorting: who to contact today
- One-click follow-up using snippets
- Email reminders + in-app alerts

### 4. Proposal System
- Builder: Problem / Solution / Scope / Timeline / Pricing
- Templates by service type
- Output: copy text / download PDF / share link
- Track: viewed / not viewed
- Accept button → converts to active deal

### 5. Invoice + Pricing
- Create invoices: items, tax, discounts
- Status: Paid / Pending / Overdue
- Suggested pricing based on past invoices
- Payment link integration, multi-currency

### 6. Task & Meeting System
- Tasks linked to clients/projects
- Priority + deadlines
- Meeting notes
- Auto-tasks: proposal sent → follow-up task, invoice sent → payment check task

### 7. Income Tracker
- Monthly income, paid vs pending
- Income over time chart

### 8. Snippets
- Save reusable messages (follow-ups, proposals, replies)
- Variables: {client_name}
- One-click insert anywhere
- Categories

### 9. Analytics
- Conversion funnel: Sent → Viewed → Replied → Closed
- Proposals sent, replies, deals closed
- Insights: "You close more in X service"

### 10. Global Features
- Universal search (clients, proposals, invoices)
- Quick action bar (add anything from anywhere)
- Smart notifications (follow-ups due, payments overdue)
- Settings: branding, currency, timezone, templates
- Export: PDF/CSV for invoices, income, client data

---

## Free vs Paid Tier

| Feature | Free | Paid |
|---|---|---|
| Leads & clients | ✓ | ✓ |
| Basic proposals | ✓ | ✓ |
| Basic invoices | ✓ | ✓ |
| Follow-up sequences | — | ✓ |
| Recurring invoices | — | ✓ |
| Branding / custom domain | — | ✓ |
| Advanced analytics | — | ✓ |
| Export CSV/PDF | — | ✓ |

---

## Key Risk
The cross-tool data flow (Lead → Proposal → Invoice → Payment) is the product's moat. If any link in the chain is broken or requires manual re-entry, the product fails its core promise.
