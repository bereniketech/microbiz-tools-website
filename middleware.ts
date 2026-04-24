import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { isConfigured, url, anonKey } = getSupabaseEnv();
  if (!isConfigured) {
    return response;
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...(options as object) });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...(options as object) });
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: "", ...(options as object) });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...(options as object) });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicProposalView = pathname.startsWith("/proposals/view/");
  const protectedPrefixes = [
    "/dashboard",
    "/leads-clients",
    "/follow-ups",
    "/proposals",
    "/invoices",
    "/tasks",
    "/income",
    "/snippets",
    "/analytics",
    "/settings",
  ];
  const isProtectedRoute = !isPublicProposalView && protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Onboarding gate: redirect new users who haven't completed onboarding
  if (user && isProtectedRoute && !pathname.startsWith("/onboarding")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && profile.onboarding_completed === false) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leads-clients/:path*",
    "/follow-ups/:path*",
    "/proposals/:path*",
    "/invoices/:path*",
    "/tasks/:path*",
    "/income/:path*",
    "/snippets/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/api/search",
  ],
};