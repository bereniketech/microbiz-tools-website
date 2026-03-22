import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const createSnippetSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  body: z.string().trim().min(1, "Body is required"),
  category: z.string().trim().optional(),
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

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const categoryFilter = request.nextUrl.searchParams.get("category")?.trim();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  let query = supabase
    .from("snippets")
    .select("id, title, body, category, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (categoryFilter) {
    query = query.eq("category", categoryFilter);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(500, "snippets_list_failed", "Could not load snippets");
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

  const parsed = createSnippetSchema.safeParse(rawBody);

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
    .insert({
      user_id: user.id,
      title: payload.title,
      body: payload.body,
      category: payload.category || null,
    })
    .select("id, title, body, category, created_at, updated_at")
    .single();

  if (error || !data) {
    return errorResponse(500, "snippet_create_failed", "Could not create snippet");
  }

  return NextResponse.json({ data }, { status: 201 });
}
