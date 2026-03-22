import { headers } from "next/headers";

import { MoneyWidget } from "@/components/dashboard/MoneyWidget";
import { PipelineWidget } from "@/components/dashboard/PipelineWidget";
import { PrioritiesWidget } from "@/components/dashboard/PrioritiesWidget";
import { QuickActions } from "@/components/dashboard/QuickActions";
import type { DashboardData } from "@/app/api/dashboard/route";

async function getDashboardData(): Promise<DashboardData | null> {
  const headersList = headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  const res = await fetch(`${protocol}://${host}/api/dashboard`, {
    // Always fetch fresh data on each request
    cache: "no-store",
    headers: {
      cookie: headersList.get("cookie") ?? "",
    },
  });

  if (!res.ok) return null;
  return res.json() as Promise<DashboardData>;
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Unable to load dashboard data. Please refresh.</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <PrioritiesWidget
        followUps={data.followUps}
        tasks={data.tasks}
        overdueInvoices={data.overdueInvoices}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PipelineWidget pipeline={data.pipeline} />
        <MoneyWidget income={data.income} />
      </div>
      <QuickActions />
    </div>
  );
}
