import { NextRequest, NextResponse } from "next/server";

import { normalizeProposalInput, updateProposalSchema } from "@/lib/proposal-schemas";
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

const DETAIL_SELECT =
  "id, client_id, lead_id, title, service_type, problem, solution, scope, timeline, pricing, status, share_token, is_template, sent_at, viewed_at, accepted_at, created_at, updated_at, clients(id, name, email, company_name)";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = context.params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  const { data, error } = await supabase
    .from("proposals")
    .select(DETAIL_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return errorResponse(404, "proposal_not_found", "Proposal not found");
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = context.params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return errorResponse(400, "invalid_json", "Malformed JSON body");
  }

  const parsed = updateProposalSchema.safeParse(rawBody);

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

  const payload = normalizeProposalInput(parsed.data);

  if (payload.client_id) {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", payload.client_id)
      .eq("user_id", user.id)
      .single();

    if (clientError || !client) {
      return errorResponse(404, "client_not_found", "Client not found");
    }
  }

  const { data, error } = await supabase
    .from("proposals")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(DETAIL_SELECT)
    .single();

  if (error || !data) {
    return errorResponse(404, "proposal_not_found", "Proposal not found");
  }

  return NextResponse.json({ data });
}