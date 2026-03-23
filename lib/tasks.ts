export const TASK_SELECT =
  "id, client_id, title, description, status, priority, due_at, completed_at, created_at, updated_at, clients(id, name, company_name)";

type TaskClientRelation =
  | {
      id: string;
      name: string | null;
      company_name: string | null;
    }
  | Array<{
      id: string;
      name: string | null;
      company_name: string | null;
    }>
  | null;

export interface TaskRow {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  clients: TaskClientRelation;
}

export interface TaskRecord {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    name: string | null;
    company_name: string | null;
  } | null;
}

function getClientRelation(related: TaskClientRelation) {
  if (!related) {
    return null;
  }

  if (Array.isArray(related)) {
    return related[0] ?? null;
  }

  return related;
}

export function normalizeTaskStatus(status: string): string {
  if (status === "done") {
    return "completed";
  }

  return status;
}

export function isTaskCompleted(status: string): boolean {
  return normalizeTaskStatus(status) === "completed";
}

export function mapTaskRow(row: TaskRow): TaskRecord {
  return {
    ...row,
    status: normalizeTaskStatus(row.status),
    client: getClientRelation(row.clients),
  };
}

export function buildInvoicePaymentCheckTaskTitle(invoiceNumber: string): string {
  return `Payment check: ${invoiceNumber}`;
}

export function buildProposalFollowUpTaskTitle(proposalTitle: string): string {
  return `Proposal follow-up: ${proposalTitle}`;
}