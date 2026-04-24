import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { resend, EMAIL_FROM } from "@/lib/resend/client";
import { InvoiceEmail } from "@/lib/resend/templates/invoice-email";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { recipientEmail?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.recipientEmail) {
    return NextResponse.json({ error: "recipientEmail is required" }, { status: 400 });
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, currency, due_date, status, clients(name)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const clientRecord = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
  const clientName = (clientRecord as { name?: string | null } | null)?.name ?? "Client";

  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const invoiceUrl = `${appUrl}/invoices/${invoice.id}`;

  const emailHtml = React.createElement(InvoiceEmail, {
    invoiceNumber: invoice.invoice_number,
    clientName,
    amount: formatCurrency(invoice.total_amount, invoice.currency),
    dueDate: invoice.due_date ? formatDate(invoice.due_date, "UTC") : "N/A",
    senderName: user.email ?? "MicroBiz Tools",
    invoiceUrl,
  });

  const { data: sendData, error: sendError } = await resend.emails.send({
    from: EMAIL_FROM,
    to: body.recipientEmail,
    subject: `Invoice ${invoice.invoice_number} from ${user.email}`,
    react: emailHtml,
  });

  if (sendError) {
    if (member?.workspace_id) {
      await supabase.from("email_logs").insert({
        workspace_id: member.workspace_id,
        entity_type: "invoice",
        entity_id: invoice.id,
        recipient_email: body.recipientEmail,
        status: "failed",
      });
    }
    return NextResponse.json({ error: "Email delivery failed" }, { status: 500 });
  }

  if (member?.workspace_id) {
    await supabase.from("email_logs").insert({
      workspace_id: member.workspace_id,
      entity_type: "invoice",
      entity_id: invoice.id,
      recipient_email: body.recipientEmail,
      resend_message_id: sendData?.id ?? null,
      status: "sent",
    });
  }

  return NextResponse.json({ success: true, messageId: sendData?.id });
}
