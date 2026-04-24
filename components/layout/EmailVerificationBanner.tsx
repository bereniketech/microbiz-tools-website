"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EmailVerificationBannerProps {
  userEmail: string;
  emailConfirmedAt: string | null;
}

export function EmailVerificationBanner({ userEmail, emailConfirmedAt }: EmailVerificationBannerProps) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (emailConfirmedAt) return null;

  async function handleResend() {
    setError(null);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: userEmail,
    });
    if (resendError) {
      setError(resendError.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex items-center justify-between gap-4">
      <span>
        Please verify your email address to access all features.
      </span>
      <div className="flex items-center gap-3 shrink-0">
        {error && <span className="text-destructive text-xs">{error}</span>}
        {sent ? (
          <span className="text-amber-700">Verification email sent!</span>
        ) : (
          <button
            onClick={handleResend}
            className="underline underline-offset-2 hover:text-amber-900 font-medium"
          >
            Resend verification email
          </button>
        )}
      </div>
    </div>
  );
}
