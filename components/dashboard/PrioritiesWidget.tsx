import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/app/api/dashboard/route";

interface PrioritiesWidgetProps {
  followUps: DashboardData["followUps"];
  tasks: DashboardData["tasks"];
  overdueInvoices: DashboardData["overdueInvoices"];
}

export function PrioritiesWidget({ followUps, tasks, overdueInvoices }: PrioritiesWidgetProps) {
  const hasItems = followUps.count > 0 || tasks.count > 0 || overdueInvoices.count > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Today&apos;s Priorities</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasItems ? (
          <p className="text-sm text-muted-foreground">Nothing pressing today — all clear!</p>
        ) : (
          <ul className="space-y-2">
            {followUps.count > 0 && (
              <li className="flex items-center gap-2 text-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                <span>
                  <span className="font-medium">{followUps.count}</span> follow-up
                  {followUps.count !== 1 ? "s" : ""} due today
                </span>
              </li>
            )}
            {tasks.count > 0 && (
              <li className="flex items-center gap-2 text-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-warning" />
                <span>
                  <span className="font-medium">{tasks.count}</span> task
                  {tasks.count !== 1 ? "s" : ""} due today
                </span>
              </li>
            )}
            {overdueInvoices.count > 0 && (
              <li className="flex items-center gap-2 text-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
                <span>
                  <span className="font-medium">{overdueInvoices.count}</span> overdue invoice
                  {overdueInvoices.count !== 1 ? "s" : ""} —{" "}
                  <span className="font-medium">
                    ${overdueInvoices.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>{" "}
                  outstanding
                </span>
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
