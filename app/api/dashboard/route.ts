import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export interface DashboardData {
  followUps: {
    count: number;
    items: Array<{ id: string; message: string | null; channel: string | null; due_at: string }>;
  };
  tasks: {
    count: number;
    items: Array<{ id: string; title: string; priority: string; due_at: string | null }>;
  };
  overdueInvoices: {
    count: number;
    totalAmount: number;
    items: Array<{ id: string; invoice_number: string; total_amount: number; due_date: string | null }>;
  };
  pipeline: {
    new: number;
    contacted: number;
    active: number;
    closed: number;
  };
  income: {
    monthEarned: number;
    pendingTotal: number;
  };
  settings: {
    currency: string;
    timezone: string;
  };
}

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [followUpsResult, tasksResult, overdueInvoicesResult, leadsResult, paymentsResult, pendingResult, settingsResult] =
    await Promise.all([
      // Follow-ups due today (not completed)
      supabase
        .from("follow_ups")
        .select("id, message, channel, due_at")
        .eq("user_id", user.id)
        .eq("status", "due")
        .gte("due_at", todayStart.toISOString())
        .lte("due_at", todayEnd.toISOString()),

      // Tasks due today (not completed)
      supabase
        .from("tasks")
        .select("id, title, priority, due_at")
        .eq("user_id", user.id)
        .not("status", "in", '("done","completed")')
        .gte("due_at", todayStart.toISOString())
        .lte("due_at", todayEnd.toISOString()),

      // Overdue invoices (already promoted by overdue sync endpoint)
      supabase
        .from("invoices")
        .select("id, invoice_number, total_amount, due_date")
        .eq("user_id", user.id)
        .eq("status", "overdue")
        .not("due_date", "is", null),

      // Leads by stage
      supabase.from("leads").select("stage").eq("user_id", user.id),

      // Payments this month (earned)
      supabase
        .from("payments")
        .select("amount")
        .eq("user_id", user.id)
        .gte("paid_at", monthStart.toISOString()),

      // Pending invoice totals
      supabase
        .from("invoices")
        .select("total_amount")
        .eq("user_id", user.id)
        .eq("status", "pending"),

      supabase
        .from("settings")
        .select("currency, timezone")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  // Pipeline counts
  const leads = leadsResult.data ?? [];
  const pipeline = {
    new: leads.filter((l) => l.stage === "new").length,
    contacted: leads.filter((l) => l.stage === "contacted").length,
    active: leads.filter((l) => l.stage === "proposal" || l.stage === "negotiation").length,
    closed: leads.filter((l) => l.stage === "closed_won").length,
  };

  // Income
  const payments = paymentsResult.data ?? [];
  const monthEarned = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingInvoices = pendingResult.data ?? [];
  const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const overdueItems = overdueInvoicesResult.data ?? [];
  const overdueTotalAmount = overdueItems.reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const data: DashboardData = {
    followUps: {
      count: followUpsResult.data?.length ?? 0,
      items: followUpsResult.data ?? [],
    },
    tasks: {
      count: tasksResult.data?.length ?? 0,
      items: tasksResult.data ?? [],
    },
    overdueInvoices: {
      count: overdueItems.length,
      totalAmount: overdueTotalAmount,
      items: overdueItems,
    },
    pipeline,
    income: {
      monthEarned,
      pendingTotal,
    },
    settings: {
      currency: settingsResult.data?.currency ?? "USD",
      timezone: settingsResult.data?.timezone ?? "UTC",
    },
  };

  return NextResponse.json(data);
}
