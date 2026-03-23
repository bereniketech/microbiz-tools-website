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

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, company_name")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) {
    return errorResponse(500, "clients_list_failed", "Could not load clients");
  }

  return NextResponse.json({ data: data ?? [] });
}