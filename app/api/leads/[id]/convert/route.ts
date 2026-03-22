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

export async function POST(_request: Request, context: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = context.params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, name, email, phone, notes, stage")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (leadError || !lead) {
    return errorResponse(404, "lead_not_found", "Lead not found");
  }

  if (lead.stage === "converted") {
    return errorResponse(409, "already_converted", "Lead is already converted");
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      notes: lead.notes,
      last_contact_at: new Date().toISOString(),
    })
    .select("id, name")
    .single();

  if (clientError || !client) {
    return errorResponse(500, "client_create_failed", "Could not create client");
  }

  const { error: leadUpdateError } = await supabase
    .from("leads")
    .update({
      stage: "converted",
      client_id: client.id,
    })
    .eq("id", lead.id)
    .eq("user_id", user.id);

  if (leadUpdateError) {
    return errorResponse(500, "lead_convert_failed", "Could not mark lead as converted");
  }

  const { error: followUpUpdateError } = await supabase
    .from("follow_ups")
    .update({
      client_id: client.id,
    })
    .eq("user_id", user.id)
    .eq("lead_id", lead.id);

  if (followUpUpdateError) {
    return errorResponse(500, "follow_up_migration_failed", "Lead converted but follow-ups were not fully migrated");
  }

  const { error: activityError } = await supabase.from("client_activities").insert({
    user_id: user.id,
    client_id: client.id,
    type: "lead_converted",
    message: `Lead converted: ${lead.name}`,
    metadata: { lead_id: lead.id },
  });

  if (activityError) {
    return errorResponse(500, "activity_create_failed", "Lead converted but timeline activity was not recorded");
  }

  return NextResponse.json({
    data: {
      lead_id: lead.id,
      client_id: client.id,
      status: "converted",
    },
  });
}
