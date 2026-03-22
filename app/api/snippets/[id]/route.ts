import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const updateSnippetSchema = z
  .object({
    title: z.string().trim().min(1, "Title cannot be empty").optional(),
    body: z.string().trim().min(1, "Body cannot be empty").optional(),
    category: z.string().trim().optional(),
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

  const parsed = updateSnippetSchema.safeParse(rawBody);

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

  const { data, error } = await supabase
    .from("snippets")
    .update({
      title: payload.title,
      body: payload.body,
      category: payload.category || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, body, category, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return errorResponse(404, "snippet_not_found", "Snippet not found");
    }

    return errorResponse(500, "snippet_update_failed", "Could not update snippet");
  }

  if (!data) {
    return errorResponse(404, "snippet_not_found", "Snippet not found");
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = context.params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  const { data, error } = await supabase.from("snippets").delete().eq("id", id).eq("user_id", user.id).select("id").single();

  if (error) {
    if (error.code === "PGRST116") {
      return errorResponse(404, "snippet_not_found", "Snippet not found");
    }

    return errorResponse(500, "snippet_delete_failed", "Could not delete snippet");
  }

  return NextResponse.json({ data });
}
