import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: [],
      },
    },
    { status },
  );
}

export async function POST(_request: Request, context: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = context.params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, client_id, invoice_number, status, total_amount, currency")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (invoiceError || !invoice) {
    return errorResponse(404, "invoice_not_found", "Invoice not found");
  }

  if (invoice.status === "paid") {
    return errorResponse(409, "already_paid", "Invoice is already paid");
  }

  const paidAt = new Date().toISOString();

  const { data: updatedInvoice, error: updateError } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: paidAt,
    })
    .eq("id", invoice.id)
    .eq("user_id", user.id)
    .select("id, client_id, invoice_number, status, total_amount, currency, paid_at")
    .single();

  if (updateError || !updatedInvoice) {
    return errorResponse(500, "invoice_pay_failed", "Could not mark invoice as paid");
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    user_id: user.id,
    invoice_id: invoice.id,
    amount: invoice.total_amount,
    method: "manual",
    paid_at: paidAt,
    notes: `Payment recorded from invoice ${invoice.invoice_number}`,
  });

  if (paymentError) {
    await supabase
      .from("invoices")
      .update({
        status: invoice.status,
        paid_at: null,
      })
      .eq("id", invoice.id)
      .eq("user_id", user.id);

    return errorResponse(500, "payment_record_failed", "Invoice updated, but payment record could not be created");
  }

  await supabase
    .from("tasks")
    .update({
      status: "done",
      completed_at: paidAt,
    })
    .eq("user_id", user.id)
    .eq("client_id", invoice.client_id)
    .eq("status", "todo")
    .ilike("title", `Payment check: ${invoice.invoice_number}`)
    .ilike("description", `%${invoice.id}%`);

  await supabase.from("client_activities").insert({
    user_id: user.id,
    client_id: invoice.client_id,
    type: "payment_received",
    message: `Payment received for ${invoice.invoice_number}`,
    metadata: { invoice_id: invoice.id },
  });

  revalidatePath("/income");
  revalidatePath("/dashboard");
  revalidatePath("/invoices");

  return NextResponse.json({ data: updatedInvoice });
}
