import { createClient } from "@/lib/supabase/server";
import { PLANS, PlanName, LimitableResource } from "./plans";

interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  plan: PlanName;
}

export async function checkLimit(
  workspaceId: string,
  resource: LimitableResource
): Promise<LimitCheckResult> {
  const supabase = createClient();

  // Get current plan
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .limit(1)
    .single();

  const plan: PlanName = (subscription?.plan as PlanName) ?? "free";
  const planConfig = PLANS[plan];
  const limit = planConfig.limits[resource];

  // Unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, plan };
  }

  // Count current usage
  const tableMap: Record<LimitableResource, string> = {
    leads: "leads",
    clients: "clients",
    invoices: "invoices",
    proposals: "proposals",
  };

  const { count } = await supabase
    .from(tableMap[resource])
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  const current = count ?? 0;

  return {
    allowed: current < limit,
    current,
    limit,
    plan,
  };
}
