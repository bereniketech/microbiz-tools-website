import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import React from "react";
import { resend, EMAIL_FROM } from "@/lib/resend/client";
import { ReminderEmail } from "@/lib/resend/templates/reminder-email";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: overdueInvoices, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, currency, due_date, workspace_id, user_id, clients(name, email)")
    .eq("status", "pending")
    .lt("due_date", today)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;

  for (const invoice of overdueInvoices ?? []) {
    const clientEmail = Array.isArray(invoice.clients)
      ? invoice.clients[0]?.email
      : (invoice.clients as { email?: string } | null)?.email;
    const clientName = Array.isArray(invoice.clients)
      ? (invoice.clients[0]?.name ?? "Client")
      : ((invoice.clients as { name?: string } | null)?.name ?? "Client");

    if (!clientEmail) continue;

    // Check if reminder already sent today
    const { count } = await supabase
      .from("email_logs")
      .select("*", { count: "exact", head: true })
      .eq("entity_type", "reminder")
      .eq("entity_id", invoice.id)
      .gte("sent_at", `${today}T00:00:00Z`);

    if ((count ?? 0) > 0) continue;

    const dueDate = new Date(invoice.due_date!);
    const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / 86400000);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: clientEmail,
      subject: `Payment Reminder — Invoice ${invoice.invoice_number}`,
      react: React.createElement(ReminderEmail, {
        invoiceNumber: invoice.invoice_number,
        clientName,
        amount: formatCurrency(invoice.total_amount, invoice.currency),
        dueDate: formatDate(invoice.due_date!, "UTC"),
        senderName: "MicroBiz Tools",
        invoiceUrl: `${appUrl}/invoices/${invoice.id}`,
        daysOverdue,
      }),
    });

    await supabase.from("email_logs").insert({
      workspace_id: invoice.workspace_id,
      entity_type: "reminder",
      entity_id: invoice.id,
      recipient_email: clientEmail,
      resend_message_id: sendData?.id ?? null,
      status: sendError ? "failed" : "sent",
    });

    if (!sendError) sent++;
  }

  return NextResponse.json({ sent });
}
