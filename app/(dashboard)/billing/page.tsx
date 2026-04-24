"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PLANS, PlanName } from "@/lib/stripe/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SubscriptionData {
  plan: PlanName;
  status: string;
  current_period_end: string | null;
}

interface UsageData {
  leads: number;
  clients: number;
  invoices: number;
  proposals: number;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData>({ leads: 0, clients: 0, invoices: 0, proposals: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data: member } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!member) { setIsLoading(false); return; }

      const [subResult, leadsResult, clientsResult, invoicesResult, proposalsResult] = await Promise.all([
        supabase.from("subscriptions").select("plan, status, current_period_end").eq("workspace_id", member.workspace_id).limit(1).single(),
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("workspace_id", member.workspace_id),
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("workspace_id", member.workspace_id),
        supabase.from("invoices").select("*", { count: "exact", head: true }).eq("workspace_id", member.workspace_id),
        supabase.from("proposals").select("*", { count: "exact", head: true }).eq("workspace_id", member.workspace_id),
      ]);

      setSubscription(subResult.data ?? { plan: "free", status: "active", current_period_end: null });
      setUsage({
        leads: leadsResult.count ?? 0,
        clients: clientsResult.count ?? 0,
        invoices: invoicesResult.count ?? 0,
        proposals: proposalsResult.count ?? 0,
      });
      setIsLoading(false);
    }
    void load();
  }, []);

  async function handleUpgrade(priceId: string, planName: string) {
    setError(null);
    setIsCheckoutLoading(planName);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    const json = await res.json();
    setIsCheckoutLoading(null);
    if (!res.ok) { setError(json.error ?? "Checkout failed"); return; }
    window.location.href = json.url;
  }

  async function handlePortal() {
    setError(null);
    setIsPortalLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const json = await res.json();
    setIsPortalLoading(false);
    if (!res.ok) { setError(json.error ?? "Failed to open billing portal"); return; }
    window.location.href = json.url;
  }

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading billing info…</p>;

  const currentPlan = subscription?.plan ?? "free";
  const planConfig = PLANS[currentPlan];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your subscription and usage.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current plan: {planConfig.displayName}</CardTitle>
          {subscription?.current_period_end && (
            <CardDescription>
              Renews {new Date(subscription.current_period_end).toLocaleDateString()}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Usage bars */}
          {(["leads", "clients", "invoices", "proposals"] as const).map((resource) => {
            const limit = planConfig.limits[resource];
            const current = usage[resource];
            const pct = limit === -1 ? 0 : Math.min(100, Math.round((current / limit) * 100));
            return (
              <div key={resource} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{resource}</span>
                  <span className="text-muted-foreground">
                    {current} / {limit === -1 ? "∞" : limit}
                  </span>
                </div>
                {limit !== -1 && (
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            );
          })}

          {subscription?.plan !== "free" && (
            <Button variant="outline" onClick={handlePortal} disabled={isPortalLoading}>
              {isPortalLoading ? "Loading…" : "Manage Billing"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["free", "pro", "business"] as PlanName[]).map((plan) => {
          const pc = PLANS[plan];
          const isCurrent = plan === currentPlan;
          return (
            <Card key={plan} className={isCurrent ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">{pc.displayName}</CardTitle>
                <CardDescription>
                  {pc.limits.leads === -1 ? "Unlimited everything" : `${pc.limits.leads} leads · ${pc.limits.clients} clients`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>Current plan</Button>
                ) : plan === "free" ? (
                  <Button variant="outline" className="w-full" disabled>Downgrade</Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={isCheckoutLoading !== null}
                    onClick={() => pc.priceId && handleUpgrade(pc.priceId, plan)}
                  >
                    {isCheckoutLoading === plan ? "Redirecting…" : "Upgrade"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
