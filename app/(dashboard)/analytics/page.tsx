import { headers } from "next/headers";

import type { AnalyticsData } from "@/app/api/analytics/route";
import { ProposalFunnelChart } from "@/components/dashboard/ProposalFunnelChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function getAnalyticsData(): Promise<AnalyticsData | null> {
  const headersList = headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  const response = await fetch(`${protocol}://${host}/api/analytics`, {
    cache: "no-store",
    headers: {
      cookie: headersList.get("cookie") ?? "",
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: AnalyticsData };
  return payload.data;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export default async function AnalyticsPage() {
  const analytics = await getAnalyticsData();

  if (!analytics) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="mt-2 text-sm text-muted-foreground">Unable to load analytics data. Please refresh.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track conversion funnel performance, close rates, and coaching insights.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Proposals Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totals.proposalsSent}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Reply Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatPercent(analytics.totals.replyRate)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Close Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatPercent(analytics.totals.closeRate)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Proposal Conversion Funnel</CardTitle>
          <CardDescription>Sent → Viewed → Replied → Closed</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.totals.proposalsSent === 0 ? (
            <p className="text-sm text-muted-foreground">No proposal activity yet. Send proposals to start seeing your funnel.</p>
          ) : (
            <ProposalFunnelChart steps={analytics.funnel.steps} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Service Close Rates</CardTitle>
            <CardDescription>Performance by proposal service type</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.serviceBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No service-level data yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Service Type</th>
                      <th className="px-3 py-2 font-medium">Sent</th>
                      <th className="px-3 py-2 font-medium">Closed</th>
                      <th className="px-3 py-2 font-medium">Close Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.serviceBreakdown.map((service) => (
                      <tr key={service.serviceType} className="border-t">
                        <td className="px-3 py-2 font-medium">{service.serviceType}</td>
                        <td className="px-3 py-2">{service.sent}</td>
                        <td className="px-3 py-2">{service.accepted}</td>
                        <td className="px-3 py-2">{formatPercent(service.closeRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Insights</CardTitle>
            <CardDescription>Actionable recommendations from your current conversion data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-dashed bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">Proposal follow-ups logged: {analytics.followUps.count}</p>
              <p className="text-sm text-muted-foreground">Follow-up ratio: {formatPercent(analytics.followUps.ratioToProposals)}</p>
            </div>
            {analytics.insights.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keep sending proposals and follow-ups. Insights will appear as data grows.</p>
            ) : (
              <div className="space-y-2">
                {analytics.insights.messages.map((message) => (
                  <p key={message} className="rounded-md border bg-background px-3 py-2 text-sm font-medium">
                    {message}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
