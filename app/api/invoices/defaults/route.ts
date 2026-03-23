import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  const [{ data: clients, error: clientsError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase.from("clients").select("id, name, email, company_name").eq("user_id", user.id).order("name", { ascending: true }),
    supabase.from("settings").select("currency, brand_name, brand_logo_url").eq("user_id", user.id).maybeSingle(),
  ]);

  if (clientsError || settingsError) {
    return errorResponse(500, "invoice_defaults_failed", "Could not load invoice defaults");
  }

  return NextResponse.json({
    data: {
      clients: clients ?? [],
      currency: settings?.currency ?? "USD",
      brand_name: settings?.brand_name ?? null,
      brand_logo_url: settings?.brand_logo_url ?? null,
    },
  });
}
