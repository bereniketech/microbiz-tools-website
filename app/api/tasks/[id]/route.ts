import { NextRequest, NextResponse } from "next/server";

import { updateTaskSchema } from "@/lib/task-schemas";
import { TASK_SELECT, isTaskCompleted, mapTaskRow, normalizeTaskStatus, type TaskRow } from "@/lib/tasks";
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

  const parsed = updateTaskSchema.safeParse(rawBody);

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

  const { data: existingTask, error: existingError } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (existingError || !existingTask) {
    return errorResponse(404, "task_not_found", "Task not found");
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

  let nextStatus: string | undefined;

  if (payload.complete === true) {
    nextStatus = "completed";
  } else if (payload.complete === false) {
    nextStatus = "todo";
  } else if (payload.status !== undefined) {
    nextStatus = normalizeTaskStatus(payload.status);
  }

  const completedAt = nextStatus === "completed" ? new Date().toISOString() : null;
  const updateData: {
    title?: string;
    client_id?: string | null;
    priority?: string;
    due_at?: string | null;
    status?: string;
    completed_at?: string | null;
  } = {};

  if (payload.title !== undefined) {
    updateData.title = payload.title;
  }

  if (payload.client_id !== undefined) {
    updateData.client_id = payload.client_id ?? null;
  }

  if (payload.priority !== undefined) {
    updateData.priority = payload.priority;
  }

  if (payload.due_at !== undefined) {
    updateData.due_at = payload.due_at ?? null;
  }

  if (nextStatus !== undefined) {
    updateData.status = nextStatus;
    updateData.completed_at = completedAt;
  }

  const wasCompleted = isTaskCompleted((existingTask as TaskRow).status);

  const { data: updatedTask, error: updateError } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(TASK_SELECT)
    .single();

  if (updateError || !updatedTask) {
    return errorResponse(500, "task_update_failed", "Could not update task");
  }

  const normalizedTask = mapTaskRow(updatedTask as TaskRow);

  if (!wasCompleted && isTaskCompleted(normalizedTask.status) && normalizedTask.client_id) {
    const { error: activityError } = await supabase.from("client_activities").insert({
      user_id: user.id,
      client_id: normalizedTask.client_id,
      type: "task_completed",
      message: `Task completed: ${normalizedTask.title}`,
      metadata: { task_id: normalizedTask.id },
    });

    if (activityError) {
      return errorResponse(500, "activity_create_failed", "Task completed but timeline activity could not be recorded");
    }
  }

  return NextResponse.json({ data: normalizedTask });
}