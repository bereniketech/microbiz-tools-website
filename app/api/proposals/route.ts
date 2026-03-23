import { NextRequest, NextResponse } from "next/server";

import { createProposalSchema, normalizeProposalInput } from "@/lib/proposal-schemas";
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

const LIST_SELECT =
  "id, client_id, lead_id, title, service_type, problem, solution, scope, timeline, pricing, status, share_token, is_template, sent_at, viewed_at, accepted_at, created_at, updated_at, clients(name)";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const statusFilter = request.nextUrl.searchParams.get("status")?.trim() ?? "all";
  const templateMode = request.nextUrl.searchParams.get("template")?.trim() ?? "exclude";
  const serviceType = request.nextUrl.searchParams.get("service_type")?.trim() ?? "";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  let query = supabase.from("proposals").select(LIST_SELECT).eq("user_id", user.id).order("created_at", { ascending: false });

  if (templateMode === "only") {
    query = query.eq("is_template", true);
  } else if (templateMode !== "include") {
    query = query.eq("is_template", false);
  }

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (serviceType) {
    query = query.eq("service_type", serviceType);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(500, "proposals_list_failed", "Could not load proposals");
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

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

  const parsed = createProposalSchema.safeParse(rawBody);

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

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", payload.client_id)
    .eq("user_id", user.id)
    .single();

  if (clientError || !client) {
    return errorResponse(404, "client_not_found", "Client not found");
  }

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      user_id: user.id,
      status: "draft",
      ...payload,
    })
    .select(LIST_SELECT)
    .single();

  if (error || !data) {
    return errorResponse(500, "proposal_create_failed", "Could not create proposal");
  }

  return NextResponse.json({ data }, { status: 201 });
}