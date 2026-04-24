"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { createClient } from "@/lib/supabase/client";

interface ForecastMonth {
  month: string;
  amount: number;
}

export function RevenueForecast() {
  const [forecast, setForecast] = useState<ForecastMonth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasEnoughData, setHasEnoughData] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { count: historyCount } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", threeMonthsAgo.toISOString());

      if ((historyCount ?? 0) < 3) {
        setHasEnoughData(false);
        setIsLoading(false);
        return;
      }

      const { data: schedules } = await supabase
        .from("recurring_invoice_schedules")
        .select("frequency, template_invoice_id, invoices(total_amount)")
        .eq("active", true);

      const { data: proposals } = await supabase
        .from("proposals")
        .select("total_amount, status")
        .eq("user_id", user.id)
        .in("status", ["draft", "sent"]);

      const months: ForecastMonth[] = [];
      for (let i = 1; i <= 3; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() + i);
        const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

        let projected = 0;

        for (const schedule of schedules ?? []) {
          const templateAmount = Array.isArray(schedule.invoices)
            ? schedule.invoices[0]?.total_amount ?? 0
            : (schedule.invoices as { total_amount?: number } | null)?.total_amount ?? 0;

          if (schedule.frequency === "monthly") projected += templateAmount;
          if (schedule.frequency === "weekly") projected += templateAmount * 4;
          if (schedule.frequency === "quarterly" && i % 3 === 0) projected += templateAmount;
        }

        const proposalValue = (proposals ?? []).reduce((sum, p) => sum + (p.total_amount ?? 0), 0);
        projected += proposalValue * 0.3;

        months.push({ month: monthLabel, amount: Math.round(projected) });
      }

      setForecast(months);
      setIsLoading(false);
    }

    void load();
  }, []);

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading forecast…</p>;

  if (!hasEnoughData) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-muted-foreground text-sm">
          Add at least 3 months of invoice history to see your revenue forecast.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h2 className="text-lg font-semibold">3-Month Revenue Forecast</h2>
      <p className="text-sm text-muted-foreground">
        Based on recurring invoices and open proposals (30% win rate assumed).
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={forecast} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Projected"]} />
          <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
