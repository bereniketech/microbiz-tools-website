"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useUserSettings } from "@/components/layout/UserSettingsProvider";
import { QuickAddLeadModal } from "@/components/leads/QuickAddLeadModal";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface LeadListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  service_needed: string | null;
  estimated_value: number | null;
  stage: string;
  created_at: string;
}

const FILTERS = [
  { label: "Active", value: "active" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Proposal", value: "proposal" },
  { label: "Negotiation", value: "negotiation" },
  { label: "Converted", value: "converted" },
  { label: "All", value: "all" },
] as const;

function formatMoney(value: number | null, currency: string): string {
  if (value === null) return "-";
  return formatCurrency(Number(value), currency, { maximumFractionDigits: 0 });
}

function contactLabel(lead: LeadListItem): string {
  return lead.email ?? lead.phone ?? "-";
}

export default function LeadsPage() {
  const { settings } = useUserSettings();
  const [selectedFilter, setSelectedFilter] = useState<(typeof FILTERS)[number]["value"]>("active");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadListItem[]>([]);

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads?status=${encodeURIComponent(selectedFilter)}`);

      if (!response.ok) {
        setError("Could not load leads.");
        return;
      }

      const payload = (await response.json()) as { data: LeadListItem[] };
      setLeads(payload.data ?? []);
    } catch {
      setError("Could not load leads.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">Capture, track, and convert opportunities.</p>
        </div>

        <QuickAddLeadModal onLeadCreated={loadLeads} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setSelectedFilter(filter.value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors",
              selectedFilter === filter.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-foreground hover:bg-accent",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading leads...</p>
      ) : leads.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No leads in this filter.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-md border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Contact</th>
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium">Estimated Value</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Created</th>
                <th className="px-4 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{lead.name}</td>
                  <td className="px-4 py-2">{contactLabel(lead)}</td>
                  <td className="px-4 py-2">{lead.service_needed ?? "-"}</td>
                  <td className="px-4 py-2">{formatMoney(lead.estimated_value, settings.currency)}</td>
                  <td className="px-4 py-2 capitalize">{lead.stage.replaceAll("_", " ")}</td>
                  <td className="px-4 py-2">{formatDate(lead.created_at, settings.timezone)}</td>
                  <td className="px-4 py-2">
                    <Link href={`/leads/${lead.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
