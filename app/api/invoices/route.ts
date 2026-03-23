import { NextRequest, NextResponse } from "next/server";

import { calculateInvoiceTotals, createInvoiceSchema } from "@/lib/invoice-schemas";
import { buildInvoicePaymentCheckTaskTitle } from "@/lib/tasks";
import { createClient } from "@/lib/supabase/server";

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

const LIST_SELECT = "id, client_id, proposal_id, invoice_number, status, currency, subtotal, tax_rate, tax_amount, total_amount, due_date, issued_at, paid_at, line_items, created_at, updated_at, clients(id, name, email, company_name)";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const statusFilter = request.nextUrl.searchParams.get("status")?.trim() ?? "all";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  let query = supabase.from("invoices").select(LIST_SELECT).eq("user_id", user.id).order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(500, "invoices_list_failed", "Could not load invoices");
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

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

  const parsed = createInvoiceSchema.safeParse(rawBody);

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

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", payload.client_id)
    .eq("user_id", user.id)
    .single();

  if (clientError || !client) {
    return errorResponse(404, "client_not_found", "Client not found");
  }

  const totals = calculateInvoiceTotals(payload.line_items, payload.tax_rate);
  const issuedAt = new Date().toISOString();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      client_id: payload.client_id,
      proposal_id: payload.proposal_id ?? null,
      invoice_number: payload.invoice_number,
      status: "pending",
      currency: payload.currency,
      subtotal: totals.subtotal,
      tax_rate: payload.tax_rate,
      tax_amount: totals.taxAmount,
      total_amount: totals.totalAmount,
      due_date: payload.due_date ?? null,
      issued_at: issuedAt,
      line_items: payload.line_items,
    })
    .select(LIST_SELECT)
    .single();

  if (invoiceError || !invoice) {
    if (invoiceError?.code === "23505") {
      return errorResponse(409, "invoice_number_conflict", "Invoice number already exists");
    }

    return errorResponse(500, "invoice_create_failed", "Could not create invoice");
  }

  const taskDueAt = payload.due_date ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: taskError } = await supabase.from("tasks").insert({
    user_id: user.id,
    client_id: payload.client_id,
    title: buildInvoicePaymentCheckTaskTitle(payload.invoice_number),
    description: `Auto-generated payment check for invoice ${payload.invoice_number} (${invoice.id}).`,
    status: "todo",
    priority: "medium",
    due_at: taskDueAt,
  });

  if (taskError) {
    await supabase.from("invoices").delete().eq("id", invoice.id).eq("user_id", user.id);
    return errorResponse(500, "task_create_failed", "Invoice created but payment-check task could not be created");
  }

  return NextResponse.json({ data: invoice }, { status: 201 });
}
