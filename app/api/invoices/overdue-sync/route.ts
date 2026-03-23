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

export async function POST() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  const overdueThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .eq("user_id", user.id)
    .eq("status", "pending")
    .lt("due_date", overdueThreshold)
    .not("due_date", "is", null);

  if (error) {
    return errorResponse(500, "overdue_sync_failed", "Could not sync overdue invoices");
  }

  return NextResponse.json({ data: { synced: true } });
}
