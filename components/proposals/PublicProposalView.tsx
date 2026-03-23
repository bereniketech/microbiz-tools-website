"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { buildProposalSharePath, formatCurrency, formatProposalStatus, getProposalPricingAmount, getProposalPricingText } from "@/lib/proposals";
import { formatDate } from "@/lib/utils/formatters";

interface PublicProposal {
  id: string;
  title: string;
  service_type: string | null;
  problem: string | null;
  solution: string | null;
  scope: string | null;
  timeline: string | null;
  pricing: unknown;
  status: string;
  share_token: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  clients?: { name: string | null; company_name?: string | null } | Array<{ name: string | null; company_name?: string | null }> | null;
}

function getClientRecord(clients: PublicProposal["clients"]) {
  if (!clients) return null;
  return Array.isArray(clients) ? (clients[0] ?? null) : clients;
}

export function PublicProposalView({ token }: { token: string }) {
  const [proposal, setProposal] = useState<PublicProposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadProposal = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proposals/view/${token}`);

      if (!response.ok) {
        setError("Proposal not found.");
        return;
      }

      const payload = (await response.json()) as { data: PublicProposal };
      setProposal(payload.data);
    } catch {
      setError("Proposal not found.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadProposal();
  }, [loadProposal]);

  const client = useMemo(() => getClientRecord(proposal?.clients ?? null), [proposal?.clients]);

  async function acceptProposal() {
    if (!proposal) return;

    setIsAccepting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/proposals/${proposal.id}/accept`, {
        method: "POST",
      });

      if (response.status === 401) {
        setError("Sign in to accept this proposal.");
        return;
      }

      if (!response.ok) {
        setError("Proposal could not be accepted.");
        return;
      }

      setSuccess("Proposal accepted.");
      await loadProposal();
    } catch {
      setError("Proposal could not be accepted.");
    } finally {
      setIsAccepting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-4xl rounded-xl border bg-card p-8 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading proposal...</p>
      </section>
    );
  }

  if (!proposal) {
    return (
      <section className="mx-auto max-w-4xl rounded-xl border bg-card p-8 shadow-sm">
        <p className="text-sm text-destructive">{error ?? "Proposal not found."}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6 rounded-xl border bg-card p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Proposal</p>
          <h1 className="mt-2 text-3xl font-semibold">{proposal.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Prepared for {client?.name ?? "Client"}
            {client?.company_name ? ` · ${client.company_name}` : ""}
          </p>
        </div>

        <div className="space-y-2 text-right">
          <p className="text-sm font-medium">{formatProposalStatus(proposal.status)}</p>
          {proposal.share_token && (
            <Link href={buildProposalSharePath(proposal.share_token)} className="text-sm text-muted-foreground underline">
              Refresh this share view
            </Link>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {[
            { label: "Problem", value: proposal.problem },
            { label: "Solution", value: proposal.solution },
            { label: "Scope", value: proposal.scope },
            { label: "Timeline", value: proposal.timeline },
            { label: "Pricing", value: getProposalPricingText(proposal.pricing) },
          ].map((section) => (
            <article key={section.label} className="rounded-lg border p-5">
              <h2 className="text-lg font-semibold">{section.label}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{section.value || "-"}</p>
            </article>
          ))}
        </div>

        <aside className="space-y-4 rounded-lg border bg-muted/30 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Service</p>
            <p className="mt-1 font-medium">{proposal.service_type || "Custom engagement"}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Investment</p>
            <p className="mt-1 text-2xl font-semibold">{formatCurrency(getProposalPricingAmount(proposal.pricing))}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Viewed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {proposal.viewed_at
                ? formatDate(proposal.viewed_at, "UTC", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
                : "Just opened"}
            </p>
          </div>

          <Button onClick={acceptProposal} disabled={isAccepting || proposal.status === "accepted"}>
            {proposal.status === "accepted" ? "Accepted" : isAccepting ? "Accepting..." : "Accept Proposal"}
          </Button>
        </aside>
      </div>
    </section>
  );
}