import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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

function addDays(baseDate: Date, days: number) {
  const copy = new Date(baseDate);
  copy.setDate(copy.getDate() + days);
  return copy;
}

const SEND_SELECT = "id, client_id, title, status, share_token, is_template, sent_at, viewed_at, accepted_at, pricing, clients(name)";

export async function POST(_request: Request, context: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = context.params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select("id, client_id, title, status, share_token, is_template")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (proposalError || !proposal) {
    return errorResponse(404, "proposal_not_found", "Proposal not found");
  }

  if (proposal.is_template) {
    return errorResponse(409, "template_cannot_send", "Templates cannot be sent until saved as a regular proposal");
  }

  const shareToken = proposal.share_token ?? crypto.randomUUID();
  const sentAt = new Date().toISOString();

  const { data: updatedProposal, error: updateError } = await supabase
    .from("proposals")
    .update({
      status: "sent",
      share_token: shareToken,
      sent_at: sentAt,
    })
    .eq("id", proposal.id)
    .eq("user_id", user.id)
    .select(SEND_SELECT)
    .single();

  if (updateError || !updatedProposal) {
    return errorResponse(500, "proposal_send_failed", "Could not send proposal");
  }

  const { data: existingFollowUp } = await supabase
    .from("follow_ups")
    .select("id")
    .eq("user_id", user.id)
    .eq("proposal_id", proposal.id)
    .limit(1)
    .maybeSingle();

  if (!existingFollowUp) {
    const { error: followUpError } = await supabase.from("follow_ups").insert({
      user_id: user.id,
      client_id: proposal.client_id,
      proposal_id: proposal.id,
      status: "due",
      due_at: addDays(new Date(), 3).toISOString(),
      channel: "email",
      message: `Follow up on proposal: ${proposal.title}`,
    });

    if (followUpError) {
      return errorResponse(500, "follow_up_create_failed", "Proposal was sent but the follow-up could not be created");
    }
  }

  const { error: activityError } = await supabase.from("client_activities").insert({
    user_id: user.id,
    client_id: proposal.client_id,
    type: "proposal_sent",
    message: `Proposal sent: ${proposal.title}`,
    metadata: { proposal_id: proposal.id },
  });

  if (activityError) {
    return errorResponse(500, "activity_create_failed", "Proposal was sent but timeline activity could not be recorded");
  }

  return NextResponse.json({
    data: {
      ...updatedProposal,
      share_url: `/proposals/view/${shareToken}`,
    },
  });
}