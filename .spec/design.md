# MicroBiz Toolbox — Design

## Architecture

```mermaid
graph TD
    Browser -->|HTTPS| Vercel
    Vercel --> NextJS[Next.js 14 App Router]
    NextJS -->|Server Components| SupabaseDB[(Supabase PostgreSQL)]
    NextJS -->|API Routes| SupabaseDB
    NextJS -->|Auth middleware| SupabaseAuth[Supabase Auth]
    SupabaseAuth --> RLS[Row Level Security]
    RLS --> SupabaseDB
    NextJS -->|PDF generation| ReactPDF[react-pdf]
    NextJS -->|Email| Resend[Resend API]
```

**Request flow:**
1. User hits a page → Next.js Server Component runs
2. Server Component queries Supabase directly (server-side client, no API round-trip)
3. Mutations go through Next.js API Route handlers (`/api/*`)
4. All DB access gated by RLS — users can only read/write their own rows
5. Client components handle UI state only; data fetching is server-side

---

## Data Models (ERD)

```mermaid
erDiagram
    users ||--o{ leads : owns
    users ||--o{ clients : owns
    users ||--o{ proposals : owns
    users ||--o{ invoices : owns
    users ||--o{ tasks : owns
    users ||--o{ follow_ups : owns
    users ||--o{ snippets : owns
    users ||--o{ settings : owns

    leads ||--o| clients : "converts to"
    clients ||--o{ proposals : has
    clients ||--o{ invoices : has
    clients ||--o{ tasks : linked
    clients ||--o{ follow_ups : linked
    proposals ||--o{ invoices : generates
    invoices ||--o{ payments : tracks

    leads {
        uuid id PK
        uuid user_id FK
        text name
        text email
        text phone
        text service
        numeric estimated_value
        text status "new|contacted|converted|lost"
        timestamp created_at
    }

    clients {
        uuid id PK
        uuid user_id FK
        uuid lead_id FK
        text name
        text email
        text phone
        text company
        text notes
        timestamp last_contact_at
        timestamp created_at
    }

    proposals {
        uuid id PK
        uuid user_id FK
        uuid client_id FK
        text title
        text problem
        text solution
        text scope
        text timeline
        jsonb pricing
        text status "draft|sent|viewed|accepted|rejected"
        text share_token
        boolean is_template
        text service_type
        timestamp sent_at
        timestamp viewed_at
        timestamp created_at
    }

    invoices {
        uuid id PK
        uuid user_id FK
        uuid client_id FK
        uuid proposal_id FK
        text invoice_number
        jsonb line_items
        numeric tax_rate
        numeric total
        text currency
        text status "pending|paid|overdue"
        date due_date
        timestamp created_at
    }

    payments {
        uuid id PK
        uuid invoice_id FK
        uuid user_id FK
        numeric amount
        text currency
        timestamp paid_at
    }

    follow_ups {
        uuid id PK
        uuid user_id FK
        uuid client_id FK
        uuid lead_id FK
        text status "waiting|due|replied|ghosted"
        text note
        date due_date
        timestamp created_at
    }

    tasks {
        uuid id PK
        uuid user_id FK
        uuid client_id FK
        text title
        text description
        text priority "low|medium|high"
        text status "pending|completed"
        date due_date
        timestamp created_at
    }

    snippets {
        uuid id PK
        uuid user_id FK
        text title
        text body
        text category
        timestamp created_at
    }

    settings {
        uuid id PK
        uuid user_id FK
        text currency "USD"
        text timezone
        text business_name
        text logo_url
        timestamp updated_at
    }
```

---

## API Design

All routes are under `/api/`. All require authenticated session (middleware validates Supabase JWT).

| Method | Route | Description |
|---|---|---|
| GET | `/api/leads` | List leads for current user |
| POST | `/api/leads` | Create lead + auto follow-up |
| PATCH | `/api/leads/:id` | Update lead |
| POST | `/api/leads/:id/convert` | Convert lead → client |
| GET | `/api/clients` | List clients |
| GET | `/api/clients/:id` | Client profile with relations |
| POST | `/api/clients` | Create client directly |
| PATCH | `/api/clients/:id` | Update client |
| GET | `/api/proposals` | List proposals |
| POST | `/api/proposals` | Create proposal + auto follow-up task |
| PATCH | `/api/proposals/:id` | Update proposal |
| POST | `/api/proposals/:id/send` | Mark sent, generate share token |
| POST | `/api/proposals/:id/accept` | Accept → create deal record |
| GET | `/api/proposals/view/:token` | Public proposal view (no auth) |
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices` | Create invoice + auto payment-check task |
| PATCH | `/api/invoices/:id` | Update invoice |
| POST | `/api/invoices/:id/pay` | Mark paid → record payment → update income |
| GET | `/api/follow-ups` | List follow-ups sorted by urgency |
| POST | `/api/follow-ups` | Create follow-up |
| PATCH | `/api/follow-ups/:id` | Update status |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update / complete task |
| GET | `/api/income` | Monthly income summary |
| GET | `/api/snippets` | List snippets |
| POST | `/api/snippets` | Create snippet |
| PATCH | `/api/snippets/:id` | Update snippet |
| GET | `/api/analytics` | Funnel + conversion metrics |
| GET | `/api/search?q=` | Search across clients, proposals, invoices |
| GET | `/api/settings` | Get user settings |
| PUT | `/api/settings` | Save user settings |
| GET | `/api/dashboard` | Aggregated dashboard data (single request) |

---

## ADRs (Architecture Decision Records)

### ADR-1: Server Components for data fetching
**Decision:** Use Next.js Server Components for all read operations; API routes only for mutations.
**Why:** Eliminates client-side fetch waterfalls, reduces JS bundle size, simpler auth (server-side Supabase client has direct DB access).

### ADR-2: Supabase RLS as the security boundary
**Decision:** All tables have RLS policies enforcing `user_id = auth.uid()`.
**Why:** Prevents data leakage even if API logic has bugs. Security is enforced at the DB layer, not just the application layer.

### ADR-3: jsonb for line_items and pricing
**Decision:** Store invoice line items and proposal pricing as `jsonb` rather than a separate table.
**Why:** Line items rarely need to be queried independently. jsonb avoids a join and keeps invoice creation in a single insert.

### ADR-4: share_token for public proposal links
**Decision:** Proposals have a `share_token` (random UUID) for public access via `/proposals/view/:token`.
**Why:** Clients should be able to view and accept proposals without creating an account. Token must be unguessable.

### ADR-5: Auto-task and auto-follow-up triggers in API layer
**Decision:** Auto-creation of follow-ups and tasks happens inside API route handlers, not DB triggers.
**Why:** Easier to test, easier to disable/configure, avoids hidden side effects in the database.

---

## Security Design

- **Auth:** Supabase Auth (JWT, httpOnly cookies via SSR helper)
- **RLS:** Every table has `USING (user_id = auth.uid())` policy
- **Public routes:** Only `/api/proposals/view/:token` is unauthenticated — read-only, no PII beyond proposal content
- **Input validation:** All API routes validate with Zod before DB write
- **CSRF:** Next.js API routes use SameSite cookies; no custom CSRF token needed
- **Secrets:** All keys in `.env`, never committed, never exposed to client bundle
- **Rate limiting:** Add Vercel Edge middleware rate limiting on auth routes (future)

---

## Performance Design

- **Dashboard API:** Single `/api/dashboard` endpoint returns all widget data in one DB query (avoid N+1 on page load)
- **Pagination:** All list endpoints support `?page=&limit=` (default limit: 50)
- **Search:** Postgres `ILIKE` with `pg_trgm` index on name/email/title columns
- **Images:** Supabase Storage for logo uploads; served via CDN
- **PDF generation:** Generated server-side on-demand, not pre-stored
- **Caching:** Next.js `revalidate` on server components for dashboard (30s); no stale data on mutations
