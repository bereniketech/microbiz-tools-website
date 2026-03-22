import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const updateLeadSchema = z
  .object({
    name: z.string().trim().min(1, "Name cannot be empty").optional(),
    contact: z.string().trim().min(1, "Contact cannot be empty").optional(),
    service: z.string().trim().optional(),
    estimated_value: z
      .preprocess((value) => {
        if (value === "" || value === undefined || value === null) return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : value;
      }, z.number().nonnegative("Estimated value must be zero or greater").nullable())
      .optional(),
    stage: z.string().trim().min(1, "Stage cannot be empty").optional(),
    notes: z.string().trim().optional(),
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

function parseContact(contact: string): { email: string | null; phone: string | null } {
  if (contact.includes("@")) {
    return { email: contact, phone: null };
  }

  return { email: null, phone: contact };
}

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
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
    .select("id, name, email, phone, service_needed, estimated_value, stage, notes, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (leadError || !lead) {
    return errorResponse(404, "lead_not_found", "Lead not found");
  }

  const { data: followUps, error: followUpsError } = await supabase
    .from("follow_ups")
    .select("id, status, due_at, channel, message")
    .eq("user_id", user.id)
    .eq("lead_id", id)
    .order("due_at", { ascending: true });

  if (followUpsError) {
    return errorResponse(500, "follow_ups_load_failed", "Lead loaded but follow-ups could not be fetched");
  }

  return NextResponse.json({
    data: {
      ...lead,
      follow_ups: followUps ?? [],
    },
  });
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

  const parsed = updateLeadSchema.safeParse(rawBody);

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
  const updateData: Record<string, string | number | null> = {};

  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.service !== undefined) updateData.service_needed = payload.service || null;
  if (payload.estimated_value !== undefined) updateData.estimated_value = payload.estimated_value;
  if (payload.stage !== undefined) updateData.stage = payload.stage;
  if (payload.notes !== undefined) updateData.notes = payload.notes || null;

  if (payload.contact !== undefined) {
    const contact = parseContact(payload.contact);
    updateData.email = contact.email;
    updateData.phone = contact.phone;
  }

  const { data, error } = await supabase
    .from("leads")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, name, email, phone, service_needed, estimated_value, stage, notes, created_at, updated_at")
    .single();

  if (error) {
    return errorResponse(500, "lead_update_failed", "Could not update lead");
  }

  if (!data) {
    return errorResponse(404, "lead_not_found", "Lead not found");
  }

  return NextResponse.json({ data });
}
