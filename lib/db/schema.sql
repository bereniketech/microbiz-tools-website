-- Extensions
create extension if not exists "pgcrypto";

-- Shared trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- 1) clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company_name text,
  notes text,
  last_contact_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clients_user_id on public.clients(user_id);

alter table public.clients enable row level security;

create policy "clients_select_own" on public.clients
for select using ((select auth.uid()) = user_id);

create policy "clients_insert_own" on public.clients
for insert with check ((select auth.uid()) = user_id);

create policy "clients_update_own" on public.clients
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "clients_delete_own" on public.clients
for delete using ((select auth.uid()) = user_id);

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

-- 1b) client_activities
create table if not exists public.client_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_client_activities_user_id on public.client_activities(user_id);
create index if not exists idx_client_activities_client_id on public.client_activities(client_id);
create index if not exists idx_client_activities_created_at on public.client_activities(created_at);

alter table public.client_activities enable row level security;

create policy "client_activities_select_own" on public.client_activities
for select using ((select auth.uid()) = user_id);

create policy "client_activities_insert_own" on public.client_activities
for insert with check ((select auth.uid()) = user_id);

create policy "client_activities_update_own" on public.client_activities
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "client_activities_delete_own" on public.client_activities
for delete using ((select auth.uid()) = user_id);

drop trigger if exists trg_client_activities_updated_at on public.client_activities;
create trigger trg_client_activities_updated_at
before update on public.client_activities
for each row execute function public.set_updated_at();

-- 2) leads
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  email text,
  phone text,
  service_needed text,
  estimated_value numeric(10,2),
  stage text not null default 'new',
  source text,
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_leads_user_id on public.leads(user_id);
create index if not exists idx_leads_client_id on public.leads(client_id);

alter table public.leads enable row level security;

create policy "leads_select_own" on public.leads
for select using ((select auth.uid()) = user_id);

create policy "leads_insert_own" on public.leads
for insert with check ((select auth.uid()) = user_id);

create policy "leads_update_own" on public.leads
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "leads_delete_own" on public.leads
for delete using ((select auth.uid()) = user_id);

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

-- 3) proposals
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  problem text,
  solution text,
  scope text,
  timeline text,
  pricing numeric(10,2),
  status text not null default 'draft',
  public_token text unique,
  sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_proposals_user_id on public.proposals(user_id);
create index if not exists idx_proposals_client_id on public.proposals(client_id);

alter table public.proposals enable row level security;

create policy "proposals_select_own" on public.proposals
for select using ((select auth.uid()) = user_id);

create policy "proposals_insert_own" on public.proposals
for insert with check ((select auth.uid()) = user_id);

create policy "proposals_update_own" on public.proposals
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "proposals_delete_own" on public.proposals
for delete using ((select auth.uid()) = user_id);

drop trigger if exists trg_proposals_updated_at on public.proposals;
create trigger trg_proposals_updated_at
before update on public.proposals
for each row execute function public.set_updated_at();

-- 4) invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete set null,
  invoice_number text not null,
  status text not null default 'pending',
  currency text not null default 'USD',
  subtotal numeric(10,2) not null default 0,
  tax_amount numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  due_date timestamptz,
  issued_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique(user_id, invoice_number)
);

create index if not exists idx_invoices_user_id on public.invoices(user_id);
create index if not exists idx_invoices_client_id on public.invoices(client_id);

alter table public.invoices enable row level security;

create policy "invoices_select_own" on public.invoices
for select using ((select auth.uid()) = user_id);

create policy "invoices_insert_own" on public.invoices
for insert with check ((select auth.uid()) = user_id);

create policy "invoices_update_own" on public.invoices
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "invoices_delete_own" on public.invoices
for delete using ((select auth.uid()) = user_id);

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

-- 5) payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(10,2) not null,
  method text,
  paid_at timestamptz not null default timezone('utc'::text, now()),
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_invoice_id on public.payments(invoice_id);

alter table public.payments enable row level security;

create policy "payments_select_own" on public.payments
for select using ((select auth.uid()) = user_id);

create policy "payments_insert_own" on public.payments
for insert with check ((select auth.uid()) = user_id);

create policy "payments_update_own" on public.payments
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "payments_delete_own" on public.payments
for delete using ((select auth.uid()) = user_id);

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- 6) follow_ups
create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete cascade,
  status text not null default 'due',
  due_at timestamptz not null,
  completed_at timestamptz,
  channel text,
  message text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_follow_ups_user_id on public.follow_ups(user_id);
create index if not exists idx_follow_ups_due_at on public.follow_ups(due_at);

alter table public.follow_ups enable row level security;

create policy "follow_ups_select_own" on public.follow_ups
for select using ((select auth.uid()) = user_id);

create policy "follow_ups_insert_own" on public.follow_ups
for insert with check ((select auth.uid()) = user_id);

create policy "follow_ups_update_own" on public.follow_ups
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "follow_ups_delete_own" on public.follow_ups
for delete using ((select auth.uid()) = user_id);

drop trigger if exists trg_follow_ups_updated_at on public.follow_ups;
create trigger trg_follow_ups_updated_at
before update on public.follow_ups
for each row execute function public.set_updated_at();

-- 7) tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'medium',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_due_at on public.tasks(due_at);

alter table public.tasks enable row level security;

create policy "tasks_select_own" on public.tasks
for select using ((select auth.uid()) = user_id);

create policy "tasks_insert_own" on public.tasks
for insert with check ((select auth.uid()) = user_id);

create policy "tasks_update_own" on public.tasks
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "tasks_delete_own" on public.tasks
for delete using ((select auth.uid()) = user_id);

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

-- 8) snippets
create table if not exists public.snippets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text,
  body text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_snippets_user_id on public.snippets(user_id);

alter table public.snippets enable row level security;

create policy "snippets_select_own" on public.snippets
for select using ((select auth.uid()) = user_id);

create policy "snippets_insert_own" on public.snippets
for insert with check ((select auth.uid()) = user_id);

create policy "snippets_update_own" on public.snippets
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "snippets_delete_own" on public.snippets
for delete using ((select auth.uid()) = user_id);

drop trigger if exists trg_snippets_updated_at on public.snippets;
create trigger trg_snippets_updated_at
before update on public.snippets
for each row execute function public.set_updated_at();

-- 9) settings
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  currency text not null default 'USD',
  timezone text not null default 'UTC',
  brand_name text,
  brand_logo_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_settings_user_id on public.settings(user_id);

alter table public.settings enable row level security;

create policy "settings_select_own" on public.settings
for select using ((select auth.uid()) = user_id);

create policy "settings_insert_own" on public.settings
for insert with check ((select auth.uid()) = user_id);

create policy "settings_update_own" on public.settings
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "settings_delete_own" on public.settings
for delete using ((select auth.uid()) = user_id);

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
before update on public.settings
for each row execute function public.set_updated_at();