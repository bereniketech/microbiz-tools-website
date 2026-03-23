import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

interface SettingsPayload {
  currency?: string;
  timezone?: string;
  brand_name?: string | null;
  brand_logo_url?: string | null;
}

const settingsPayloadSchema = z.object({
  currency: z.string().optional(),
  timezone: z.string().optional(),
  brand_name: z.string().nullable().optional(),
  brand_logo_url: z.string().nullable().optional(),
});

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: [],
      },
    },
    { status },
  );
}

function normalizeCurrency(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const value = raw.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(value)) {
    return null;
  }

  try {
    const sample = new Intl.NumberFormat("en-US", { style: "currency", currency: value }).format(1);
    return sample ? value : null;
  } catch {
    return null;
  }
}

function normalizeTimezone(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const value = raw.trim();

  if (!value) {
    return null;
  }

  try {
    const sample = new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return sample ? value : null;
  } catch {
    return null;
  }
}

function normalizeOptionalString(raw: unknown): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (typeof raw !== "string") {
    return null;
  }

  const value = raw.trim();
  return value.length > 0 ? value : null;
}

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  const { data, error } = await supabase
    .from("settings")
    .select("currency, timezone, brand_name, brand_logo_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return errorResponse(500, "settings_load_failed", "Could not load settings");
  }

  return NextResponse.json({
    data: {
      currency: data?.currency ?? "USD",
      timezone: data?.timezone ?? "UTC",
      brand_name: data?.brand_name ?? null,
      brand_logo_url: data?.brand_logo_url ?? null,
    },
  });
}

export async function PUT(request: NextRequest) {
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

  const parsed = settingsPayloadSchema.safeParse(rawBody ?? {});

  if (!parsed.success) {
    return errorResponse(422, "validation_error", "Request validation failed");
  }

  const payload = parsed.data as SettingsPayload;

  const currency = normalizeCurrency(payload.currency);
  const timezone = normalizeTimezone(payload.timezone);
  const brandName = normalizeOptionalString(payload.brand_name);
  const brandLogoUrl = normalizeOptionalString(payload.brand_logo_url);

  if (!currency) {
    return errorResponse(422, "invalid_currency", "Currency must be a valid 3-letter ISO code");
  }

  if (!timezone) {
    return errorResponse(422, "invalid_timezone", "Timezone must be a valid IANA timezone");
  }

  if (brandLogoUrl && !/^https?:\/\//i.test(brandLogoUrl)) {
    return errorResponse(422, "invalid_logo_url", "Logo URL must be absolute (http/https)");
  }

  const { data, error } = await supabase
    .from("settings")
    .upsert(
      {
        user_id: user.id,
        currency,
        timezone,
        brand_name: brandName,
        brand_logo_url: brandLogoUrl,
      },
      { onConflict: "user_id" },
    )
    .select("currency, timezone, brand_name, brand_logo_url")
    .single();

  if (error || !data) {
    return errorResponse(500, "settings_save_failed", "Could not save settings");
  }

  return NextResponse.json({ data });
}
