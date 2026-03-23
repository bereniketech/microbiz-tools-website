import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: [],
      },
    },
    { status },
  );
}

const PUBLIC_SELECT =
  "id, title, service_type, problem, solution, scope, timeline, pricing, status, share_token, is_template, sent_at, viewed_at, accepted_at, created_at, clients(name, company_name)";

export async function GET(_request: Request, context: { params: { token: string } }) {
  const admin = createAdminClient();
  const { token } = context.params;

  if (!admin) {
    return errorResponse(503, "server_misconfigured", "Public proposal views are not available right now");
  }

  const { data: proposal, error } = await admin.from("proposals").select(PUBLIC_SELECT).eq("share_token", token).single();

  if (error || !proposal || proposal.is_template) {
    return errorResponse(404, "proposal_not_found", "Proposal not found");
  }

  if (!proposal.viewed_at) {
    const viewedAt = new Date().toISOString();

    const { data: updatedProposal } = await admin
      .from("proposals")
      .update({
        viewed_at: viewedAt,
        status: proposal.status === "sent" ? "viewed" : proposal.status,
      })
      .eq("id", proposal.id)
      .select(PUBLIC_SELECT)
      .single();

    if (updatedProposal) {
      return NextResponse.json({ data: updatedProposal });
    }
  }

  return NextResponse.json({ data: proposal });
}