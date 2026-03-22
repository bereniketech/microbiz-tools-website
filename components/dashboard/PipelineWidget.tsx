import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/app/api/dashboard/route";

interface PipelineWidgetProps {
  pipeline: DashboardData["pipeline"];
}

export function PipelineWidget({ pipeline }: PipelineWidgetProps) {
  const total = pipeline.new + pipeline.contacted + pipeline.active + pipeline.closed;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Pipeline Snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">No leads yet. Add your first lead to get started.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md bg-muted px-3 py-2 text-center">
              <p className="text-2xl font-bold">{pipeline.new}</p>
              <p className="text-xs text-muted-foreground">New</p>
            </div>
            <div className="rounded-md bg-muted px-3 py-2 text-center">
              <p className="text-2xl font-bold">{pipeline.contacted}</p>
              <p className="text-xs text-muted-foreground">Contacted</p>
            </div>
            <div className="rounded-md bg-muted px-3 py-2 text-center">
              <p className="text-2xl font-bold">{pipeline.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="rounded-md bg-muted px-3 py-2 text-center">
              <p className="text-2xl font-bold">{pipeline.closed}</p>
              <p className="text-xs text-muted-foreground">Closed</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
