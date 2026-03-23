"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency, formatProposalStatus, getProposalPricingAmount } from "@/lib/proposals";

interface ProposalListItem {
  id: string;
  title: string;
  service_type: string | null;
  pricing: unknown;
  status: string;
  sent_at: string | null;
  created_at: string;
  clients?: { name: string | null } | Array<{ name: string | null }> | null;
}

const FILTERS = ["all", "draft", "sent", "viewed", "accepted", "rejected"] as const;

function getClientName(clients: ProposalListItem["clients"]) {
  if (!clients) return "Unknown client";
  return Array.isArray(clients) ? (clients[0]?.name ?? "Unknown client") : (clients.name ?? "Unknown client");
}

export default function ProposalsPage() {
  const [selectedFilter, setSelectedFilter] = useState<(typeof FILTERS)[number]>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);

  const loadProposals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proposals?status=${encodeURIComponent(selectedFilter)}`);

      if (!response.ok) {
        setError("Could not load proposals.");
        return;
      }

      const payload = (await response.json()) as { data: ProposalListItem[] };
      setProposals(payload.data ?? []);
    } catch {
      setError("Could not load proposals.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Proposals</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track drafts, sent proposals, views, and accepted deals.</p>
        </div>

        <Link href="/proposals/new" className={cn(buttonVariants({}))}>
          New Proposal
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setSelectedFilter(filter)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors",
              selectedFilter === filter ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent",
            )}
          >
            {formatProposalStatus(filter)}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading proposals...</p>
      ) : proposals.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No proposals in this filter.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-md border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Last Activity</th>
                <th className="px-4 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => (
                <tr key={proposal.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{proposal.title}</td>
                  <td className="px-4 py-2">{getClientName(proposal.clients)}</td>
                  <td className="px-4 py-2">{proposal.service_type ?? "-"}</td>
                  <td className="px-4 py-2">{formatCurrency(getProposalPricingAmount(proposal.pricing))}</td>
                  <td className="px-4 py-2">{formatProposalStatus(proposal.status)}</td>
                  <td className="px-4 py-2">{new Date(proposal.sent_at ?? proposal.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <Link href={`/proposals/${proposal.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
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
