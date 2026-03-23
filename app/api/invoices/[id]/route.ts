import { NextRequest, NextResponse } from "next/server";

import { calculateInvoiceTotals, updateInvoiceSchema } from "@/lib/invoice-schemas";
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

const DETAIL_SELECT =
  "id, client_id, proposal_id, invoice_number, status, currency, subtotal, tax_rate, tax_amount, total_amount, due_date, issued_at, paid_at, line_items, created_at, updated_at, clients(id, name, email, company_name)";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = context.params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  const [{ data: invoice, error: invoiceError }, { data: setting }] = await Promise.all([
    supabase.from("invoices").select(DETAIL_SELECT).eq("id", id).eq("user_id", user.id).single(),
    supabase.from("settings").select("currency, timezone, brand_name, brand_logo_url").eq("user_id", user.id).maybeSingle(),
  ]);

  if (invoiceError || !invoice) {
    return errorResponse(404, "invoice_not_found", "Invoice not found");
  }

  return NextResponse.json({
    data: {
      ...invoice,
      branding: {
        currency: setting?.currency ?? invoice.currency,
        timezone: setting?.timezone ?? "UTC",
        brand_name: setting?.brand_name ?? null,
        brand_logo_url: setting?.brand_logo_url ?? null,
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

  const parsed = updateInvoiceSchema.safeParse(rawBody);

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

  const updates = parsed.data;

  const { data: existingInvoice, error: existingError } = await supabase
    .from("invoices")
    .select("id, tax_rate, line_items")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (existingError || !existingInvoice) {
    return errorResponse(404, "invoice_not_found", "Invoice not found");
  }

  const nextTaxRate = updates.tax_rate ?? existingInvoice.tax_rate ?? 0;
  const nextLineItems = updates.line_items ?? (Array.isArray(existingInvoice.line_items) ? existingInvoice.line_items : []);
  const payload: Record<string, unknown> = {
    ...updates,
  };

  if (updates.tax_rate !== undefined || updates.line_items !== undefined) {
    const totals = calculateInvoiceTotals(nextLineItems, nextTaxRate);
    payload.subtotal = totals.subtotal;
    payload.tax_amount = totals.taxAmount;
    payload.total_amount = totals.totalAmount;
  }

  const { data: invoice, error: updateError } = await supabase
    .from("invoices")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(DETAIL_SELECT)
    .single();

  if (updateError || !invoice) {
    return errorResponse(404, "invoice_not_found", "Invoice not found");
  }

  return NextResponse.json({ data: invoice });
}
