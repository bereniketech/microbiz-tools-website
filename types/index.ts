export type UUID = string;

export interface Lead {
  id: UUID;
  user_id: UUID;
  client_id: UUID | null;
  name: string;
  email: string | null;
  phone: string | null;
  service_needed: string | null;
  estimated_value: number | null;
  stage: string;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: UUID;
  user_id: UUID;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  notes: string | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientActivity {
  id: UUID;
  user_id: UUID;
  client_id: UUID;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: UUID;
  user_id: UUID;
  client_id: UUID;
  lead_id: UUID | null;
  title: string;
  problem: string | null;
  solution: string | null;
  scope: string | null;
  timeline: string | null;
  pricing: number | null;
  status: string;
  public_token: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: UUID;
  user_id: UUID;
  client_id: UUID;
  proposal_id: UUID | null;
  invoice_number: string;
  status: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  due_date: string | null;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: UUID;
  user_id: UUID;
  invoice_id: UUID;
  amount: number;
  method: string | null;
  paid_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUp {
  id: UUID;
  user_id: UUID;
  client_id: UUID | null;
  lead_id: UUID | null;
  proposal_id: UUID | null;
  status: string;
  due_at: string;
  completed_at: string | null;
  channel: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: UUID;
  user_id: UUID;
  client_id: UUID | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Snippet {
  id: UUID;
  user_id: UUID;
  title: string;
  category: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: UUID;
  user_id: UUID;
  currency: string;
  timezone: string;
  brand_name: string | null;
  brand_logo_url: string | null;
  created_at: string;
  updated_at: string;
}