import { NextRequest, NextResponse } from "next/server";
import React from "react";

import { buildProposalFollowUpTaskTitle } from "@/lib/tasks";
import { resend, EMAIL_FROM } from "@/lib/resend/client";
import { ProposalEmail } from "@/lib/resend/templates/proposal-email";
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

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = context.params;

  let recipientEmail: string | undefined;
  try {
    const body = await request.json() as { recipientEmail?: string };
    recipientEmail = body.recipientEmail;
  } catch {
    // body is optional
  }

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

  const followUpDueAt = addDays(new Date(), 3).toISOString();

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
      due_at: followUpDueAt,
      channel: "email",
      message: `Follow up on proposal: ${proposal.title}`,
    });

    if (followUpError) {
      return errorResponse(500, "follow_up_create_failed", "Proposal was sent but the follow-up could not be created");
    }
  }

  const proposalTaskTitle = buildProposalFollowUpTaskTitle(proposal.title);

  const { data: existingTask } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("client_id", proposal.client_id)
    .ilike("title", proposalTaskTitle)
    .ilike("description", `%${proposal.id}%`)
    .limit(1)
    .maybeSingle();

  if (!existingTask) {
    const { error: taskError } = await supabase.from("tasks").insert({
      user_id: user.id,
      client_id: proposal.client_id,
      title: proposalTaskTitle,
      description: `Auto-generated proposal follow-up for proposal ${proposal.title} (${proposal.id}).`,
      status: "todo",
      priority: "high",
      due_at: followUpDueAt,
    });

    if (taskError) {
      return errorResponse(500, "task_create_failed", "Proposal was sent but the follow-up task could not be created");
    }
  }

  // Send email via Resend if recipientEmail provided
  if (recipientEmail) {
    const { data: member } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const proposalUrl = `${appUrl}/proposals/view/${shareToken}`;
    const clientRecord = Array.isArray(updatedProposal.clients) ? updatedProposal.clients[0] : updatedProposal.clients;
    const clientName = (clientRecord as { name?: string | null } | null)?.name ?? "Client";

    const emailHtml = React.createElement(ProposalEmail, {
      proposalTitle: updatedProposal.title,
      clientName,
      senderName: user.email ?? "MicroBiz Tools",
      proposalUrl,
    });

    const { data: sendData, error: sendEmailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipientEmail,
      subject: `Proposal: ${updatedProposal.title}`,
      react: emailHtml,
    });

    if (member?.workspace_id) {
      await supabase.from("email_logs").insert({
        workspace_id: member.workspace_id,
        entity_type: "proposal",
        entity_id: proposal.id,
        recipient_email: recipientEmail,
        resend_message_id: sendEmailError ? null : (sendData?.id ?? null),
        status: sendEmailError ? "failed" : "sent",
      });
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