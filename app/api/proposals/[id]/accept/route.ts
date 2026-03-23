import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { buildProposalFollowUpTaskTitle } from "@/lib/tasks";
import { createClient } from "@/lib/supabase/server";

const acceptSchema = z.object({
  share_token: z.string().uuid().optional(),
});

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

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const supabase = createClient();
  const admin = createAdminClient();
  const { id } = context.params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let rawBody: unknown = {};

  try {
    rawBody = await request.json();
  } catch {
    rawBody = {};
  }

  const parsed = acceptSchema.safeParse(rawBody);

  if (!parsed.success) {
    return errorResponse(
      422,
      "validation_error",
      "Request validation failed",
      parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
        code: issue.code,
      })),
    );
  }

  const shareToken = parsed.data.share_token;
  const acceptedAt = new Date().toISOString();

  if (!user && !shareToken) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  if (!user && !admin) {
    return errorResponse(503, "server_misconfigured", "Public proposal actions are not available right now");
  }

  if (user) {
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

  const { data: proposal, error: proposalError } = await admin!
    .from("proposals")
    .update({
      status: "accepted",
      accepted_at: acceptedAt,
      viewed_at: acceptedAt,
    })
    .eq("id", id)
    .eq("share_token", shareToken)
    .select("id, user_id, client_id, title, status, accepted_at")
    .single();

  if (proposalError || !proposal) {
    return errorResponse(404, "proposal_not_found", "Proposal not found");
  }

  await admin!.from("client_activities").insert({
    user_id: proposal.user_id,
    client_id: proposal.client_id,
    type: "proposal_accepted",
    message: `Proposal accepted: ${proposal.title}`,
    metadata: { proposal_id: proposal.id, source: "public_share" },
  });

  await admin!
    .from("tasks")
    .update({
      status: "completed",
      completed_at: acceptedAt,
    })
    .eq("user_id", proposal.user_id)
    .eq("client_id", proposal.client_id)
    .eq("status", "todo")
    .ilike("title", buildProposalFollowUpTaskTitle(proposal.title))
    .ilike("description", `%${proposal.id}%`);

  return NextResponse.json({ data: proposal });
}