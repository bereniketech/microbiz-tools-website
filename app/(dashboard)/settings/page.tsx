"use client";

import { useEffect, useMemo, useState } from "react";

import { useUserSettings } from "@/components/layout/UserSettingsProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface SettingsResponse {
  data: {
    currency: string;
    timezone: string;
    brand_name: string | null;
    brand_logo_url: string | null;
  };
}

const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY", "NGN", "ZAR"];
const LOGO_BUCKET = process.env.NEXT_PUBLIC_SETTINGS_LOGO_BUCKET ?? "settings-logos";

function getTimezoneOptions(selectedTimezone: string) {
  const commonTimezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  if (!selectedTimezone || commonTimezones.includes(selectedTimezone)) {
    return commonTimezones;
  }

  return [selectedTimezone, ...commonTimezones];
}

export default function SettingsPage() {
  const supabase = createClient();
  const { settings, setSettings } = useUserSettings();

  const [businessName, setBusinessName] = useState(settings.brand_name ?? "");
  const [currency, setCurrency] = useState(settings.currency);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [logoUrl, setLogoUrl] = useState(settings.brand_logo_url ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const timezoneOptions = useMemo(() => getTimezoneOptions(timezone), [timezone]);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/settings", { cache: "no-store" });

        if (!response.ok) {
          if (!cancelled) {
            setError("Could not load settings.");
          }
          return;
        }

        const payload = (await response.json()) as SettingsResponse;

        if (!cancelled) {
          setBusinessName(payload.data.brand_name ?? "");
          setCurrency(payload.data.currency ?? "USD");
          setTimezone(payload.data.timezone ?? "UTC");
          setLogoUrl(payload.data.brand_logo_url ?? "");
          setSettings(payload.data);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load settings.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [setSettings]);

  async function uploadLogo(file: File) {
    setIsUploadingLogo(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Sign in to upload a logo.");
        return;
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "-");
      const path = `${user.id}/${Date.now()}-${safeName}`;

      const { data, error: uploadError } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, {
        upsert: true,
        cacheControl: "3600",
      });

      if (uploadError || !data) {
        setError("Logo upload failed. Confirm the storage bucket and permissions.");
        return;
      }

      const { data: publicUrlData } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(data.path);
      setLogoUrl(publicUrlData.publicUrl);
      setSuccess("Logo uploaded. Save settings to persist.");
    } catch {
      setError("Logo upload failed.");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function saveSettings() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          timezone,
          brand_name: businessName,
          brand_logo_url: logoUrl || null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(payload?.error?.message ?? "Could not save settings.");
        return;
      }

      const payload = (await response.json()) as SettingsResponse;
      setSettings(payload.data);
      setSuccess("Settings saved.");
    } catch {
      setError("Could not save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Loading settings...</p>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-lg border bg-card p-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Control branding and regional defaults for invoices and date displays.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="settings-business-name">Business name</Label>
          <Input
            id="settings-business-name"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder="Acme Studio"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-currency">Currency</Label>
          <select
            id="settings-currency"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-timezone">Timezone</Label>
          <select
            id="settings-timezone"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
          >
            {timezoneOptions.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-logo">Logo upload</Label>
          <Input
            id="settings-logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(event) => {
              const nextFile = event.target.files?.[0];
              if (nextFile) {
                void uploadLogo(nextFile);
              }
            }}
            disabled={isUploadingLogo}
          />
          <p className="text-xs text-muted-foreground">Uploads to Supabase Storage bucket: {LOGO_BUCKET}</p>
          {logoUrl ? (
            <div className="rounded-md border p-3">
              <p className="mb-2 text-xs uppercase text-muted-foreground">Current logo</p>
              <img src={logoUrl} alt="Business logo preview" className="max-h-20 w-auto" />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={saveSettings} disabled={isSaving || isUploadingLogo}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </section>
  );
}
