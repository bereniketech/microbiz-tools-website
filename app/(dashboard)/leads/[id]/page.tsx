"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useUserSettings } from "@/components/layout/UserSettingsProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";

interface FollowUpItem {
  id: string;
  status: string;
  due_at: string;
  channel: string | null;
  message: string | null;
}

interface LeadDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  service_needed: string | null;
  estimated_value: number | null;
  stage: string;
  notes: string | null;
  created_at: string;
  follow_ups: FollowUpItem[];
}

const STAGE_OPTIONS = ["new", "contacted", "proposal", "negotiation", "converted"];

export default function LeadDetailPage() {
  const { settings } = useUserSettings();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const leadId = params.id;

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [stage, setStage] = useState("new");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadLead = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}`);

      if (!response.ok) {
        setError("Lead could not be loaded.");
        return;
      }

      const payload = (await response.json()) as { data: LeadDetail };
      setLead(payload.data);
      setStage(payload.data.stage);
      setNotes(payload.data.notes ?? "");
    } catch {
      setError("Lead could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void loadLead();
  }, [loadLead]);

  async function onSave() {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage,
          notes,
        }),
      });

      if (!response.ok) {
        setError("Lead could not be updated.");
        return;
      }

      setSuccessMessage("Lead updated.");
      await loadLead();
    } catch {
      setError("Lead could not be updated.");
    } finally {
      setIsSaving(false);
    }
  }

  async function onConvert() {
    setIsConverting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/convert`, {
        method: "POST",
      });

      if (!response.ok) {
        setError("Lead could not be converted.");
        return;
      }

      setSuccessMessage("Lead converted to client.");
      await loadLead();
    } catch {
      setError("Lead could not be converted.");
    } finally {
      setIsConverting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Loading lead...</p>
      </section>
    );
  }

  if (!lead) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <p className="text-sm text-destructive">Lead not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/leads")}>Back to leads</Button>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{lead.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {formatDate(lead.created_at, settings.timezone, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>

        <Button variant="outline" onClick={() => router.push("/leads")}>Back to leads</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-md border p-4">
          <h2 className="font-semibold">Contact Info</h2>
          <p className="text-sm">Email: {lead.email ?? "-"}</p>
          <p className="text-sm">Phone: {lead.phone ?? "-"}</p>
          <p className="text-sm">Service: {lead.service_needed ?? "-"}</p>
          <p className="text-sm">
            Estimated Value:{" "}
            {lead.estimated_value === null
              ? "-"
              : formatCurrency(Number(lead.estimated_value), settings.currency)}
          </p>
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <h2 className="font-semibold">Status & Notes</h2>

          <div className="space-y-1.5">
            <Label htmlFor="lead-stage">Status</Label>
            <select
              id="lead-stage"
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={stage}
              onChange={(event) => setStage(event.target.value)}
            >
              {STAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-notes">Notes</Label>
            <textarea
              id="lead-notes"
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
            <Button
              variant="outline"
              onClick={onConvert}
              disabled={isConverting || lead.stage === "converted"}
            >
              {lead.stage === "converted" ? "Already Converted" : isConverting ? "Converting..." : "Convert to Client"}
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}
        </div>
      </div>

      <div className="rounded-md border p-4">
        <h2 className="font-semibold">Follow-Ups</h2>

        {lead.follow_ups.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No follow-ups yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {lead.follow_ups.map((item) => (
              <li key={item.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium capitalize">{item.status}</p>
                <p className="text-muted-foreground">
                  Due: {formatDate(item.due_at, settings.timezone, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
                <p className="text-muted-foreground">Channel: {item.channel ?? "-"}</p>
                <p>{item.message ?? "No message"}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
