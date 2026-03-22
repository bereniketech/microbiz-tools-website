import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const createFollowUpSchema = z.object({
  client_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  proposal_id: z.string().uuid().optional().nullable(),
  status: z.enum(["waiting", "due", "replied", "ghosted"]).optional(),
  due_at: z.string().datetime(),
  channel: z.string().trim().optional(),
  message: z.string().trim().optional(),
});

type FollowUpRow = {
  id: string;
  status: string;
  due_at: string;
  completed_at: string | null;
  channel: string | null;
  message: string | null;
  client_id: string | null;
  lead_id: string | null;
  proposal_id: string | null;
  created_at: string;
  updated_at: string;
  clients: { name: string | null } | Array<{ name: string | null }> | null;
  leads: { name: string | null } | Array<{ name: string | null }> | null;
};

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

function getTodayBounds() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  return { todayStart, todayEnd };
}

function getRelatedName(related: { name: string | null } | Array<{ name: string | null }> | null): string | null {
  if (!related) return null;
  if (Array.isArray(related)) return related[0]?.name ?? null;
  return related.name ?? null;
}

function urgencyRank(row: FollowUpRow, now: Date): number {
  if (row.status === "ghosted") return 3;
  if (row.status === "replied") return 4;

  const { todayStart, todayEnd } = getTodayBounds();
  const dueAt = new Date(row.due_at);

  if (dueAt < todayStart) return 0;
  if (dueAt <= todayEnd) return 1;
  if (dueAt > now) return 2;

  return 2;
}

export async function GET() {
  const supabase = createClient();
  const now = new Date();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  const { data, error } = await supabase
    .from("follow_ups")
    .select(
      "id, status, due_at, completed_at, channel, message, client_id, lead_id, proposal_id, created_at, updated_at, clients(name), leads(name)",
    )
    .eq("user_id", user.id);

  if (error) {
    return errorResponse(500, "follow_ups_list_failed", "Could not load follow-ups");
  }

  const rows = ((data ?? []) as FollowUpRow[])
    .map((row) => ({
      ...row,
      display_name: getRelatedName(row.clients) ?? getRelatedName(row.leads) ?? "Unknown contact",
    }))
    .sort((a, b) => {
      const urgencyDiff = urgencyRank(a, now) - urgencyRank(b, now);
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    });

  return NextResponse.json({ data: rows });
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

  const parsed = createFollowUpSchema.safeParse(rawBody);

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
    .from("follow_ups")
    .insert({
      user_id: user.id,
      client_id: payload.client_id ?? null,
      lead_id: payload.lead_id ?? null,
      proposal_id: payload.proposal_id ?? null,
      status: payload.status ?? "due",
      due_at: payload.due_at,
      channel: payload.channel ?? null,
      message: payload.message ?? null,
    })
    .select("id, status, due_at, completed_at, channel, message, client_id, lead_id, proposal_id, created_at, updated_at")
    .single();

  if (error || !data) {
    return errorResponse(500, "follow_up_create_failed", "Could not create follow-up");
  }

  return NextResponse.json({ data }, { status: 201 });
}