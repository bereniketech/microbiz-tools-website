import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);

    // Create workspace for new users (idempotent — returns 400 if already exists)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workspace/create`, {
        method: "POST",
        headers: { cookie: request.headers.get("cookie") ?? "" },
      });
    } catch {
      // Non-blocking — workspace creation failure should not block login
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
