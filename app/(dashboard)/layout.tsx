import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmailVerificationBanner } from "@/components/layout/EmailVerificationBanner";
import { UserSettingsProvider } from "@/components/layout/UserSettingsProvider";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialSettings = {
    currency: "USD",
    timezone: "UTC",
    brand_name: null as string | null,
    brand_logo_url: null as string | null,
  };

  if (user) {
    const { data } = await supabase
      .from("settings")
      .select("currency, timezone, brand_name, brand_logo_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      initialSettings = {
        currency: data.currency ?? "USD",
        timezone: data.timezone ?? "UTC",
        brand_name: data.brand_name ?? null,
        brand_logo_url: data.brand_logo_url ?? null,
      };
    }
  }

  const emailConfirmedAt = user?.email_confirmed_at ?? null;
  const userEmail = user?.email ?? "";

  return (
    <DashboardShell>
      <EmailVerificationBanner userEmail={userEmail} emailConfirmedAt={emailConfirmedAt} />
      <UserSettingsProvider initialSettings={initialSettings}>{children}</UserSettingsProvider>
    </DashboardShell>
  );
}
