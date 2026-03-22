import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const createLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  contact: z.string().trim().min(1, "Contact is required"),
  service: z.string().trim().optional(),
  estimated_value: z
    .preprocess((value) => {
      if (value === "" || value === undefined || value === null) return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    }, z.number().nonnegative("Estimated value must be zero or greater").optional()),
  notes: z.string().trim().optional(),
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

function parseContact(contact: string): { email: string | null; phone: string | null } {
  if (contact.includes("@")) {
    return { email: contact, phone: null };
  }

  return { email: null, phone: contact };
}

function addDays(baseDate: Date, days: number): Date {
  const copy = new Date(baseDate);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const statusFilter = request.nextUrl.searchParams.get("status")?.trim() ?? "active";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  let query = supabase
    .from("leads")
    .select("id, name, email, phone, service_needed, estimated_value, stage, notes, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (statusFilter === "active") {
    query = query.neq("stage", "converted");
  } else if (statusFilter !== "all") {
    query = query.eq("stage", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(500, "leads_list_failed", "Could not load leads");
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

  const parsed = createLeadSchema.safeParse(rawBody);

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
  const contact = parseContact(payload.contact);

  const { data: createdLead, error: leadError } = await supabase
    .from("leads")
    .insert({
      user_id: user.id,
      name: payload.name,
      email: contact.email,
      phone: contact.phone,
      service_needed: payload.service || null,
      estimated_value: payload.estimated_value ?? null,
      notes: payload.notes || null,
      stage: "new",
    })
    .select("id, name, email, phone, service_needed, estimated_value, stage, notes, created_at")
    .single();

  if (leadError || !createdLead) {
    return errorResponse(500, "lead_create_failed", "Could not create lead");
  }

  const followUpDue = addDays(new Date(), 2).toISOString();

  const { error: followUpError } = await supabase.from("follow_ups").insert({
    user_id: user.id,
    lead_id: createdLead.id,
    status: "due",
    due_at: followUpDue,
    message: `Initial follow-up for ${createdLead.name}`,
    channel: "email",
  });

  if (followUpError) {
    await supabase.from("leads").delete().eq("id", createdLead.id).eq("user_id", user.id);
    return errorResponse(500, "follow_up_create_failed", "Lead follow-up could not be created");
  }

  return NextResponse.json({ data: createdLead }, { status: 201 });
}
