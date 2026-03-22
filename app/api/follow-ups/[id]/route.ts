import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const updateFollowUpSchema = z
  .object({
    status: z.enum(["waiting", "due", "replied", "ghosted"]),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
    path: ["body"],
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

  const parsed = updateFollowUpSchema.safeParse(rawBody);

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

  const payload = parsed.data;

  const updateData: { status: string; completed_at?: string | null } = {
    status: payload.status,
  };

  if (payload.status === "replied") {
    updateData.completed_at = new Date().toISOString();
  } else {
    updateData.completed_at = null;
  }

  const { data, error } = await supabase
    .from("follow_ups")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, status, due_at, completed_at, channel, message, client_id, lead_id, proposal_id, created_at, updated_at")
    .single();

  if (error) {
    return errorResponse(500, "follow_up_update_failed", "Could not update follow-up");
  }

  if (!data) {
    return errorResponse(404, "follow_up_not_found", "Follow-up not found");
  }

  return NextResponse.json({ data });
}