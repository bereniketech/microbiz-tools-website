import { headers } from "next/headers";

import type { IncomeData } from "@/app/api/income/route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncomeHistoryChart } from "@/components/dashboard/IncomeHistoryChart";
import { formatCurrency } from "@/lib/utils/formatters";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function getIncomeData(): Promise<IncomeData | null> {
  const headersList = headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  const response = await fetch(`${protocol}://${host}/api/income`, {
    headers: {
      cookie: headersList.get("cookie") ?? "",
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: IncomeData };
  return payload.data;
}

export default async function IncomePage() {
  const income = await getIncomeData();

  if (!income) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-semibold">Income</h1>
        <p className="mt-2 text-sm text-muted-foreground">Unable to load income data. Please refresh.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Income</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track monthly earnings, pending receivables, and trends.</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export/csv?type=income"
            download
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Export CSV
          </a>
          <a
            href="/api/export/pdf"
            download
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Export PDF
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Earned this month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{formatCurrency(income.monthEarned, income.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">{formatCurrency(income.pendingTotal, income.currency)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Last 6 months income</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeHistoryChart history={income.history} currency={income.currency} />
        </CardContent>
      </Card>
    </section>
  );
}
