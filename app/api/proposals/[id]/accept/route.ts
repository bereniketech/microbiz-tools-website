import { NextResponse } from "next/server";

import { buildProposalFollowUpTaskTitle } from "@/lib/tasks";
import { createClient } from "@/lib/supabase/server";

function errorResponse(status: number, code: string, message: string, details?: Array<{ field: string; message: string; code: string }>) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? [],
      },
    },
    { status },
  );
}

export async function POST(_request: Request, context: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = context.params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const acceptedAt = new Date().toISOString();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }
  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .update({
      status: "accepted",
      accepted_at: acceptedAt,
      viewed_at: acceptedAt,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, client_id, title, status, accepted_at")
    .single();

  if (proposalError || !proposal) {
    return errorResponse(404, "proposal_not_found", "Proposal not found");
  }

  await supabase.from("client_activities").insert({
    user_id: user.id,
    client_id: proposal.client_id,
    type: "proposal_accepted",
    message: `Proposal accepted: ${proposal.title}`,
    metadata: { proposal_id: proposal.id },
  });

  await supabase
    .from("tasks")
    .update({
      status: "completed",
      completed_at: acceptedAt,
    })
    .eq("user_id", user.id)
    .eq("client_id", proposal.client_id)
    .eq("status", "todo")
    .ilike("title", buildProposalFollowUpTaskTitle(proposal.title))
    .ilike("description", `%${proposal.id}%`);

  return NextResponse.json({ data: proposal });
}