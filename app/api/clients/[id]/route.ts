import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const updateClientSchema = z
  .object({
    name: z.string().trim().min(1, "Name cannot be empty").optional(),
    email: z.string().trim().email("Invalid email").or(z.literal("")).optional(),
    phone: z.string().trim().optional(),
    company_name: z.string().trim().optional(),
    note: z.string().trim().min(1, "Note cannot be empty").optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
    path: ["body"],
  });

interface TimelineItem {
  id: string;
  type: string;
  message: string;
  happened_at: string;
}

function errorResponse(status: number, code: string, message: string, details?: Array<{ field: string; message: string; code: string }>) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? [],
      },
    },
    { status },
  );
}

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = context.params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, email, phone, company_name, notes, last_contact_at, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (clientError || !client) {
    return errorResponse(404, "client_not_found", "Client not found");
  }

  const [
    { data: leads, error: leadsError },
    { data: proposals, error: proposalsError },
    { data: invoices, error: invoicesError },
    { data: tasks, error: tasksError },
    { data: followUps, error: followUpsError },
    { data: activities, error: activitiesError },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id, name, stage, created_at, updated_at")
      .eq("user_id", user.id)
      .eq("client_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("proposals")
      .select("id, title, status, pricing, sent_at, created_at")
      .eq("user_id", user.id)
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, invoice_number, status, currency, total_amount, issued_at, due_date, paid_at, created_at, payments(id, amount, method, paid_at, notes)")
      .eq("user_id", user.id)
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_at, completed_at, created_at")
      .eq("user_id", user.id)
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("follow_ups")
      .select("id, status, due_at, completed_at, channel, message, created_at")
      .eq("user_id", user.id)
      .eq("client_id", id)
      .order("due_at", { ascending: true }),
    supabase
      .from("client_activities")
      .select("id, type, message, created_at")
      .eq("user_id", user.id)
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (leadsError || proposalsError || invoicesError || tasksError || followUpsError || activitiesError) {
    return errorResponse(500, "client_relations_load_failed", "Client loaded but related data could not be fetched");
  }

  const invoiceRows = (invoices ?? []) as Array<{
    id: string;
    invoice_number: string;
    status: string;
    currency: string;
    total_amount: number;
    issued_at: string | null;
    due_date: string | null;
    paid_at: string | null;
    created_at: string;
    payments: Array<{ id: string; amount: number; method: string | null; paid_at: string; notes: string | null }> | null;
  }>;

  const payments = invoiceRows.flatMap((invoice) =>
    (invoice.payments ?? []).map((payment) => ({
      ...payment,
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
    })),
  );

  const clientValue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  const activeDeals = (proposals ?? []).filter((proposal) => proposal.status === "accepted");

  const timeline: TimelineItem[] = [];

  (leads ?? []).forEach((lead) => {
    timeline.push({
      id: `lead-created-${lead.id}`,
      type: "lead_created",
      message: `Lead created: ${lead.name}`,
      happened_at: lead.created_at,
    });

    if (lead.stage === "converted") {
      timeline.push({
        id: `lead-converted-${lead.id}`,
        type: "lead_converted",
        message: `Lead converted: ${lead.name}`,
        happened_at: lead.updated_at,
      });
    }
  });

  (proposals ?? []).forEach((proposal) => {
    if (proposal.sent_at) {
      timeline.push({
        id: `proposal-sent-${proposal.id}`,
        type: "proposal_sent",
        message: `Proposal sent: ${proposal.title}`,
        happened_at: proposal.sent_at,
      });
    }
  });

  invoiceRows.forEach((invoice) => {
    if (invoice.issued_at) {
      timeline.push({
        id: `invoice-issued-${invoice.id}`,
        type: "invoice_sent",
        message: `Invoice sent: ${invoice.invoice_number}`,
        happened_at: invoice.issued_at,
      });
    }
  });

  payments.forEach((payment) => {
    timeline.push({
      id: `payment-received-${payment.id}`,
      type: "payment_received",
      message: `Payment received for ${payment.invoice_number}`,
      happened_at: payment.paid_at,
    });
  });

  (activities ?? []).forEach((activity) => {
    timeline.push({
      id: `activity-${activity.id}`,
      type: activity.type,
      message: activity.message,
      happened_at: activity.created_at,
    });
  });

  timeline.sort((a, b) => new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime());

  const lastContactAt = client.last_contact_at ?? client.created_at;
  const isCold = new Date(lastContactAt).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000;

  return NextResponse.json({
    data: {
      client,
      leads: leads ?? [],
      active_deals: activeDeals,
      proposals: proposals ?? [],
      invoices: invoiceRows.map(({ payments: _payments, ...invoice }) => invoice),
      payments,
      tasks: tasks ?? [],
      follow_ups: followUps ?? [],
      timeline,
      stats: {
        client_value: clientValue,
        total_payments: payments.length,
        paid_invoice_count: invoiceRows.filter((invoice) => invoice.status === "paid").length,
        total_invoice_count: invoiceRows.length,
        is_cold: isCold,
      },
    },
  });
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = context.params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return errorResponse(400, "invalid_json", "Malformed JSON body");
  }

  const parsed = updateClientSchema.safeParse(rawBody);

  if (!parsed.success) {
    return errorResponse(
      422,
      "validation_error",
      "Request validation failed",
      parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
        code: issue.code,
      })),
    );
  }

  const payload = parsed.data;
  const { data: currentClient, error: currentClientError } = await supabase
    .from("clients")
    .select("id, notes")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (currentClientError || !currentClient) {
    return errorResponse(404, "client_not_found", "Client not found");
  }

  const updateData: Record<string, string | null> = {};

  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.email !== undefined) updateData.email = payload.email || null;
  if (payload.phone !== undefined) updateData.phone = payload.phone || null;
  if (payload.company_name !== undefined) updateData.company_name = payload.company_name || null;

  let noteValue: string | null = null;

  if (payload.note !== undefined) {
    noteValue = payload.note.trim();

    const nowIso = new Date().toISOString();
    const stampedNote = `[${nowIso}] ${noteValue}`;

    updateData.notes = currentClient.notes ? `${currentClient.notes}\n${stampedNote}` : stampedNote;
    updateData.last_contact_at = nowIso;
  }

  const { data: updatedClient, error: updateError } = await supabase
    .from("clients")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, name, email, phone, company_name, notes, last_contact_at, created_at, updated_at")
    .single();

  if (updateError || !updatedClient) {
    return errorResponse(500, "client_update_failed", "Could not update client");
  }

  if (noteValue) {
    const { error: activityError } = await supabase.from("client_activities").insert({
      user_id: user.id,
      client_id: id,
      type: "note_added",
      message: `Note added: ${noteValue}`,
      metadata: { source: "client_profile" },
    });

    if (activityError) {
      return errorResponse(500, "activity_create_failed", "Client updated but timeline note could not be recorded");
    }
  }

  return NextResponse.json({ data: updatedClient });
}
