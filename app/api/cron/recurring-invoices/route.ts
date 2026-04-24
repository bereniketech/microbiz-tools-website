import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notifications/create";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient(url, key);
}

function addInterval(date: Date, frequency: string): Date {
  const d = new Date(date);
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  if (frequency === "quarterly") d.setMonth(d.getMonth() + 3);
  return d;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: schedules, error } = await supabase
    .from("recurring_invoice_schedules")
    .select("*, invoices(*)")
    .eq("active", true)
    .lte("next_run_date", today);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;

  for (const schedule of schedules ?? []) {
    const template = schedule.invoices;
    if (!template) continue;

    // Check end_date
    if (schedule.end_date && today > schedule.end_date) {
      await supabase
        .from("recurring_invoice_schedules")
        .update({ active: false })
        .eq("id", schedule.id);
      continue;
    }

    // Create new invoice from template
    const { data: newInvoice } = await supabase.from("invoices").insert({
      user_id: template.user_id,
      workspace_id: schedule.workspace_id,
      client_id: template.client_id,
      invoice_number: `${template.invoice_number}-R${Date.now()}`,
      total_amount: template.total_amount,
      currency: template.currency,
      status: "pending",
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    }).select("id").single();

    // Advance next_run_date
    const nextDate = addInterval(new Date(schedule.next_run_date), schedule.frequency);
    await supabase
      .from("recurring_invoice_schedules")
      .update({ next_run_date: nextDate.toISOString().split("T")[0] })
      .eq("id", schedule.id);

    // Create notification for workspace owner
    if (newInvoice?.id) {
      const { data: owner } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", schedule.workspace_id)
        .eq("role", "owner")
        .limit(1)
        .single();

      if (owner) {
        await createNotification({
          workspaceId: schedule.workspace_id,
          userId: owner.user_id,
          type: "recurring_invoice_generated",
          message: `Recurring invoice generated: ${template.invoice_number}`,
          metadata: { href: `/invoices/${newInvoice.id}`, invoiceId: newInvoice.id },
        });
      }
    }

    processed++;
  }

  return NextResponse.json({ processed });
}
