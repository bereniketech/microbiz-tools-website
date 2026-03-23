import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

interface IncomeHistoryPoint {
  key: string;
  label: string;
  total: number;
}

export interface IncomeData {
  monthEarned: number;
  pendingTotal: number;
  history: IncomeHistoryPoint[];
}

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

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildHistorySkeleton() {
  const currentMonth = new Date();
  currentMonth.setUTCDate(1);
  currentMonth.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: 6 }, (_, index) => {
    const month = new Date(currentMonth);
    month.setUTCMonth(currentMonth.getUTCMonth() - (5 - index));

    return {
      key: monthKey(month),
      label: month.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }),
      total: 0,
    };
  });
}

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  const thisMonthStart = new Date();
  thisMonthStart.setUTCDate(1);
  thisMonthStart.setUTCHours(0, 0, 0, 0);

  const historyStart = new Date(thisMonthStart);
  historyStart.setUTCMonth(thisMonthStart.getUTCMonth() - 5);

  const [paymentsResult, pendingResult] = await Promise.all([
    supabase
      .from("payments")
      .select("amount, paid_at")
      .eq("user_id", user.id)
      .gte("paid_at", historyStart.toISOString()),
    supabase
      .from("invoices")
      .select("total_amount")
      .eq("user_id", user.id)
      .eq("status", "pending"),
  ]);

  if (paymentsResult.error) {
    return errorResponse(500, "income_payments_failed", "Could not load income payments");
  }

  if (pendingResult.error) {
    return errorResponse(500, "income_pending_failed", "Could not load pending invoices");
  }

  const history = buildHistorySkeleton();
  const historyMap = new Map(history.map((point) => [point.key, point]));
  const currentMonthKey = monthKey(thisMonthStart);

  for (const payment of paymentsResult.data ?? []) {
    if (!payment.paid_at) {
      continue;
    }

    const key = monthKey(new Date(payment.paid_at));
    const point = historyMap.get(key);

    if (!point) {
      continue;
    }

    point.total += Number(payment.amount);
  }

  const pendingTotal = (pendingResult.data ?? []).reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);
  const monthEarned = historyMap.get(currentMonthKey)?.total ?? 0;

  const data: IncomeData = {
    monthEarned,
    pendingTotal,
    history,
  };

  return NextResponse.json({ data });
}