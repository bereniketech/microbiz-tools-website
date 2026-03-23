import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/app/api/dashboard/route";
import { formatCurrency } from "@/lib/utils/formatters";

interface MoneyWidgetProps {
  income: DashboardData["income"];
  currency: string;
}

export function MoneyWidget({ income, currency }: MoneyWidgetProps) {
  const hasData = income.monthEarned > 0 || income.pendingTotal > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Money Snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground">No income recorded yet this month.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-success-subtle px-3 py-2">
              <p className="text-xl font-bold text-success">
                {formatCurrency(income.monthEarned, currency)}
              </p>
              <p className="text-xs text-muted-foreground">Earned this month</p>
            </div>
            <div className="rounded-md bg-warning-subtle px-3 py-2">
              <p className="text-xl font-bold text-warning">
                {formatCurrency(income.pendingTotal, currency)}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
