import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createTaskSchema } from "@/lib/task-schemas";
import { TASK_SELECT, mapTaskRow, type TaskRow } from "@/lib/tasks";
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

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const statusFilter = request.nextUrl.searchParams.get("status")?.trim() ?? "all";
  const clientFilter = request.nextUrl.searchParams.get("client_id")?.trim() ?? "";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  if (clientFilter) {
    const clientIdCheck = z.string().uuid().safeParse(clientFilter);

    if (!clientIdCheck.success) {
      return errorResponse(422, "validation_error", "Request validation failed", [
        {
          field: "client_id",
          message: "Client id must be a valid UUID",
          code: "invalid_string",
        },
      ]);
    }
  }

  let query = supabase.from("tasks").select(TASK_SELECT).eq("user_id", user.id).order("created_at", { ascending: false });

  if (statusFilter === "todo") {
    query = query.eq("status", "todo");
  } else if (statusFilter === "completed") {
    query = query.in("status", ["completed", "done"]);
  }

  if (clientFilter) {
    query = query.eq("client_id", clientFilter);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(500, "tasks_list_failed", "Could not load tasks");
  }

  return NextResponse.json({ data: ((data ?? []) as TaskRow[]).map(mapTaskRow) });
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

  const parsed = createTaskSchema.safeParse(rawBody);

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
    .from("tasks")
    .insert({
      user_id: user.id,
      client_id: payload.client_id ?? null,
      title: payload.title,
      status: "todo",
      priority: payload.priority,
      due_at: payload.due_at ?? null,
    })
    .select(TASK_SELECT)
    .single();

  if (error || !data) {
    return errorResponse(500, "task_create_failed", "Could not create task");
  }

  return NextResponse.json({ data: mapTaskRow(data as TaskRow) }, { status: 201 });
}