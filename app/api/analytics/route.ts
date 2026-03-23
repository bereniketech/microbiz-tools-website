import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type ProposalRow = {
  status: string;
  service_type: string | null;
};

export interface AnalyticsData {
  funnel: {
    sent: number;
    viewed: number;
    replied: number;
    closed: number;
    steps: Array<{ label: string; count: number }>;
  };
  totals: {
    proposalsSent: number;
    replyRate: number;
    closeRate: number;
  };
  serviceBreakdown: Array<{
    serviceType: string;
    sent: number;
    accepted: number;
    closeRate: number;
  }>;
  followUps: {
    count: number;
    ratioToProposals: number;
  };
  insights: {
    bestServiceType: string | null;
    followUpLow: boolean;
    messages: string[];
  };
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function isSentStatus(status: string) {
  return status === "sent" || status === "viewed" || status === "accepted" || status === "rejected";
}

function isViewedStatus(status: string) {
  return status === "viewed" || status === "accepted" || status === "rejected";
}

function isRepliedStatus(status: string) {
  return status === "accepted" || status === "rejected";
}

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [proposalsResult, followUpsResult] = await Promise.all([
    supabase.from("proposals").select("status, service_type").eq("user_id", user.id).eq("is_template", false),
    supabase.from("follow_ups").select("id", { count: "exact", head: true }).eq("user_id", user.id).not("proposal_id", "is", null),
  ]);

  if (proposalsResult.error) {
    return NextResponse.json({ error: "Could not load analytics" }, { status: 500 });
  }

  const proposals = (proposalsResult.data ?? []) as ProposalRow[];
  const statuses = proposals.map((proposal) => proposal.status);

  const sentCount = statuses.filter(isSentStatus).length;
  const viewedCount = statuses.filter(isViewedStatus).length;
  const repliedCount = statuses.filter(isRepliedStatus).length;
  const closedCount = statuses.filter((status) => status === "accepted").length;

  const replyRate = sentCount > 0 ? roundToSingleDecimal((viewedCount / sentCount) * 100) : 0;
  const closeRate = sentCount > 0 ? roundToSingleDecimal((closedCount / sentCount) * 100) : 0;

  const serviceMap = new Map<string, { sent: number; accepted: number }>();
  for (const proposal of proposals) {
    if (!isSentStatus(proposal.status)) continue;

    const normalizedService = proposal.service_type?.trim() || "Uncategorized";
    const current = serviceMap.get(normalizedService) ?? { sent: 0, accepted: 0 };
    current.sent += 1;
    if (proposal.status === "accepted") {
      current.accepted += 1;
    }
    serviceMap.set(normalizedService, current);
  }

  const serviceBreakdown = Array.from(serviceMap.entries())
    .map(([serviceType, totals]) => {
      const serviceCloseRate = totals.sent > 0 ? roundToSingleDecimal((totals.accepted / totals.sent) * 100) : 0;
      return {
        serviceType,
        sent: totals.sent,
        accepted: totals.accepted,
        closeRate: serviceCloseRate,
      };
    })
    .sort((a, b) => b.closeRate - a.closeRate || b.sent - a.sent || a.serviceType.localeCompare(b.serviceType));

  const overallCloseRateFraction = sentCount > 0 ? closedCount / sentCount : 0;
  const outperformingServices = serviceBreakdown.filter((service) => {
    if (service.sent === 0) return false;
    return service.accepted / service.sent > overallCloseRateFraction;
  });

  const bestServiceType = outperformingServices[0]?.serviceType ?? null;
  const followUpsCount = followUpsResult.count ?? 0;
  const followUpRatio = sentCount > 0 ? roundToSingleDecimal((followUpsCount / sentCount) * 100) : 0;
  const followUpLow = sentCount > 0 && followUpsCount < Math.ceil(sentCount * 0.5);

  const insightMessages: string[] = [];
  if (bestServiceType) {
    insightMessages.push(`You close more ${bestServiceType} deals`);
  }
  if (followUpLow) {
    insightMessages.push("You don't follow up enough");
  }

  const data: AnalyticsData = {
    funnel: {
      sent: sentCount,
      viewed: viewedCount,
      replied: repliedCount,
      closed: closedCount,
      steps: [
        { label: "Sent", count: sentCount },
        { label: "Viewed", count: viewedCount },
        { label: "Replied", count: repliedCount },
        { label: "Closed", count: closedCount },
      ],
    },
    totals: {
      proposalsSent: sentCount,
      replyRate,
      closeRate,
    },
    serviceBreakdown,
    followUps: {
      count: followUpsCount,
      ratioToProposals: followUpRatio,
    },
    insights: {
      bestServiceType,
      followUpLow,
      messages: insightMessages,
    },
  };

  return NextResponse.json({ data });
}
