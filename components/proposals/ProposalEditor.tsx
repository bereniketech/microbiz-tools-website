"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildProposalSharePath, formatCurrency, formatProposalStatus, getProposalPricingAmount, getProposalPricingText } from "@/lib/proposals";

interface ClientOption {
  id: string;
  name: string;
  email: string | null;
  company_name: string | null;
}

interface ProposalRecord {
  id: string;
  client_id: string;
  title: string;
  service_type: string | null;
  problem: string | null;
  solution: string | null;
  scope: string | null;
  timeline: string | null;
  pricing: unknown;
  status: string;
  share_token: string | null;
  is_template: boolean;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  clients?: { name: string | null; email?: string | null; company_name?: string | null } | Array<{ name: string | null; email?: string | null; company_name?: string | null }> | null;
}

interface ProposalFormState {
  client_id: string;
  title: string;
  service_type: string;
  problem: string;
  solution: string;
  scope: string;
  timeline: string;
  pricing_text: string;
  pricing_amount: string;
  is_template: boolean;
}

const EMPTY_FORM: ProposalFormState = {
  client_id: "",
  title: "",
  service_type: "",
  problem: "",
  solution: "",
  scope: "",
  timeline: "",
  pricing_text: "",
  pricing_amount: "",
  is_template: false,
};

function getClientRecord(clients: ProposalRecord["clients"]) {
  if (!clients) return null;
  return Array.isArray(clients) ? (clients[0] ?? null) : clients;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fieldToLines(value: string) {
  return escapeHtml(value || "-").replaceAll("\n", "<br />");
}

function proposalToForm(record: ProposalRecord): ProposalFormState {
  return {
    client_id: record.client_id,
    title: record.title,
    service_type: record.service_type ?? "",
    problem: record.problem ?? "",
    solution: record.solution ?? "",
    scope: record.scope ?? "",
    timeline: record.timeline ?? "",
    pricing_text: getProposalPricingText(record.pricing),
    pricing_amount: getProposalPricingAmount(record.pricing)?.toString() ?? "",
    is_template: record.is_template,
  };
}

function toPayload(form: ProposalFormState) {
  return {
    client_id: form.client_id,
    title: form.title,
    service_type: form.service_type,
    problem: form.problem,
    solution: form.solution,
    scope: form.scope,
    timeline: form.timeline,
    pricing_text: form.pricing_text,
    pricing_amount: form.pricing_amount,
    is_template: form.is_template,
  };
}

export function ProposalEditor({ proposalId }: { proposalId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<ProposalFormState>(EMPTY_FORM);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [templates, setTemplates] = useState<ProposalRecord[]>([]);
  const [activeProposalId, setActiveProposalId] = useState<string | null>(proposalId ?? null);
  const [status, setStatus] = useState<string>("draft");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadReferenceData = useCallback(async () => {
    const [clientsResponse, templatesResponse] = await Promise.all([
      fetch("/api/clients"),
      fetch("/api/proposals?template=only"),
    ]);

    if (!clientsResponse.ok || !templatesResponse.ok) {
      throw new Error("reference_load_failed");
    }

    const clientsPayload = (await clientsResponse.json()) as { data: ClientOption[] };
    const templatesPayload = (await templatesResponse.json()) as { data: ProposalRecord[] };

    setClients(clientsPayload.data ?? []);
    setTemplates(templatesPayload.data ?? []);
  }, []);

  const loadProposal = useCallback(async (id: string) => {
    const response = await fetch(`/api/proposals/${id}`);

    if (!response.ok) {
      throw new Error("proposal_load_failed");
    }

    const payload = (await response.json()) as { data: ProposalRecord };
    setForm(proposalToForm(payload.data));
    setActiveProposalId(payload.data.id);
    setStatus(payload.data.status);
    setShareToken(payload.data.share_token);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        await loadReferenceData();
        if (proposalId) {
          await loadProposal(proposalId);
        }
        if (!cancelled && !proposalId) {
          setForm(EMPTY_FORM);
          setStatus("draft");
          setShareToken(null);
        }
      } catch {
        if (!cancelled) {
          setError("Proposal builder could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [loadProposal, loadReferenceData, proposalId]);

  const selectedClient = useMemo(() => clients.find((client) => client.id === form.client_id) ?? null, [clients, form.client_id]);

  const filteredTemplates = useMemo(() => {
    if (!form.service_type.trim()) return templates;

    const normalizedService = form.service_type.trim().toLowerCase();

    return templates.filter((template) => {
      if (!template.service_type) return true;
      return template.service_type.toLowerCase() === normalizedService;
    });
  }, [form.service_type, templates]);

  const shareLink = shareToken ? buildProposalSharePath(shareToken) : null;

  function updateField<Key extends keyof ProposalFormState>(key: Key, value: ProposalFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((entry) => entry.id === templateId);
    if (!template) return;

    setForm((current) => ({
      ...current,
      title: current.title || template.title,
      service_type: template.service_type ?? current.service_type,
      problem: template.problem ?? "",
      solution: template.solution ?? "",
      scope: template.scope ?? "",
      timeline: template.timeline ?? "",
      pricing_text: getProposalPricingText(template.pricing),
      pricing_amount: getProposalPricingAmount(template.pricing)?.toString() ?? "",
      is_template: false,
    }));
    setSuccess("Template applied.");
  }

  async function saveProposal(sendAfterSave: boolean) {
    setError(null);
    setSuccess(null);

    if (!form.client_id || !form.title.trim()) {
      setError("Client and title are required.");
      return;
    }

    if (sendAfterSave && form.is_template) {
      setError("Templates cannot be sent. Turn off Save as template first.");
      return;
    }

    const isCreate = !activeProposalId;
    setIsSaving(true);

    try {
      const response = await fetch(isCreate ? "/api/proposals" : `/api/proposals/${activeProposalId}`, {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });

      if (!response.ok) {
        setError("Proposal could not be saved.");
        return;
      }

      const payload = (await response.json()) as { data: ProposalRecord };
      const nextProposal = payload.data;
      setForm(proposalToForm(nextProposal));
      setActiveProposalId(nextProposal.id);
      setStatus(nextProposal.status);
      setShareToken(nextProposal.share_token);

      if (sendAfterSave) {
        setIsSending(true);
        const sendResponse = await fetch(`/api/proposals/${nextProposal.id}/send`, { method: "POST" });

        if (!sendResponse.ok) {
          setError("Proposal was saved, but it could not be sent.");
          return;
        }

        const sendPayload = (await sendResponse.json()) as { data: ProposalRecord & { share_url: string } };
        setStatus(sendPayload.data.status);
        setShareToken(sendPayload.data.share_token);
        setSuccess("Proposal sent. Share link is ready.");
        router.replace(`/proposals/${nextProposal.id}`);
        return;
      }

      setSuccess(isCreate ? "Proposal created." : "Proposal updated.");

      if (isCreate) {
        router.replace(`/proposals/${nextProposal.id}`);
      }
    } catch {
      setError("Proposal could not be saved.");
    } finally {
      setIsSaving(false);
      setIsSending(false);
    }
  }

  async function copyShareLink() {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(window.location.origin + shareLink);
      setSuccess("Share link copied.");
    } catch {
      setError("Share link could not be copied.");
    }
  }

  function downloadPdf() {
    const pricingAmount = form.pricing_amount ? Number(form.pricing_amount) : null;
    const printableWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printableWindow) {
      setError("Popup blocked. Allow popups to print the proposal.");
      return;
    }

    printableWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(form.title)} - Proposal</title>
          <style>
            body { font-family: Georgia, serif; margin: 48px; color: #111827; }
            h1 { font-size: 32px; margin-bottom: 8px; }
            h2 { font-size: 18px; margin: 28px 0 8px; }
            p { line-height: 1.6; }
            .meta { color: #4b5563; margin-bottom: 24px; }
            .section { border-top: 1px solid #e5e7eb; padding-top: 12px; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(form.title)}</h1>
          <p class="meta">Prepared for ${escapeHtml(selectedClient?.name ?? "Client")}</p>
          <div class="section"><h2>Problem</h2><p>${fieldToLines(form.problem)}</p></div>
          <div class="section"><h2>Solution</h2><p>${fieldToLines(form.solution)}</p></div>
          <div class="section"><h2>Scope</h2><p>${fieldToLines(form.scope)}</p></div>
          <div class="section"><h2>Timeline</h2><p>${fieldToLines(form.timeline)}</p></div>
          <div class="section"><h2>Pricing</h2><p>${fieldToLines(form.pricing_text)}</p><p>${escapeHtml(formatCurrency(Number.isFinite(pricingAmount) ? pricingAmount : null))}</p></div>
        </body>
      </html>
    `);
    printableWindow.document.close();
    printableWindow.focus();
    printableWindow.print();
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Loading proposal builder...</p>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{activeProposalId ? "Proposal" : "New Proposal"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Build a structured proposal, save templates, and share a public accept link.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeProposalId && (
            <Button variant="outline" onClick={downloadPdf}>
              Download PDF
            </Button>
          )}
          {shareLink && (
            <>
              <Button variant="outline" onClick={copyShareLink}>
                Copy Share Link
              </Button>
              <Link href={shareLink} target="_blank" rel="noreferrer" className="inline-flex">
                <Button variant="outline">Open Public View</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4 rounded-md border p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="proposal-client">Client</Label>
              <select
                id="proposal-client"
                value={form.client_id}
                onChange={(event) => updateField("client_id", event.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proposal-title">Title</Label>
              <Input id="proposal-title" value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Website redesign proposal" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="proposal-service">Service Type</Label>
              <Input id="proposal-service" value={form.service_type} onChange={(event) => updateField("service_type", event.target.value)} placeholder="Branding, web design, consulting" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proposal-template">Template</Label>
              <select
                id="proposal-template"
                onChange={(event) => {
                  if (event.target.value) {
                    applyTemplate(event.target.value);
                    event.target.value = "";
                  }
                }}
                className="h-10 rounded-md border bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="">Apply a template</option>
                {filteredTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_template} onChange={(event) => updateField("is_template", event.target.checked)} />
            Save this proposal as a reusable template
          </label>

          {[
            { key: "problem", label: "Problem" },
            { key: "solution", label: "Solution" },
            { key: "scope", label: "Scope" },
            { key: "timeline", label: "Timeline" },
            { key: "pricing_text", label: "Pricing" },
          ].map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key}>{field.label}</Label>
              <textarea
                id={field.key}
                value={form[field.key as keyof ProposalFormState] as string}
                onChange={(event) => updateField(field.key as keyof ProposalFormState, event.target.value as never)}
                rows={field.key === "pricing_text" ? 5 : 6}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <Label htmlFor="proposal-amount">Optional Price Amount</Label>
            <Input id="proposal-amount" type="number" min="0" step="0.01" value={form.pricing_amount} onChange={(event) => updateField("pricing_amount", event.target.value)} placeholder="5000" />
          </div>
        </div>

        <aside className="space-y-4 rounded-md border p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
            <p className="mt-1 text-lg font-semibold">{formatProposalStatus(status)}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Client</p>
            <p className="mt-1 font-medium">{selectedClient?.name ?? "Select a client"}</p>
            <p className="text-sm text-muted-foreground">{selectedClient?.company_name ?? selectedClient?.email ?? ""}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Amount</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(form.pricing_amount ? Number(form.pricing_amount) : null)}</p>
          </div>

          {shareLink && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Public share link</p>
              <p className="mt-1 break-all text-muted-foreground">{typeof window === "undefined" ? shareLink : `${window.location.origin}${shareLink}`}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={() => void saveProposal(false)} disabled={isSaving || isSending}>
              {isSaving ? "Saving..." : activeProposalId ? "Save Changes" : "Save Proposal"}
            </Button>
            <Button variant="outline" onClick={() => void saveProposal(true)} disabled={isSaving || isSending || form.is_template}>
              {isSending ? "Sending..." : "Save and Send"}
            </Button>
            <Link href="/proposals" className="inline-flex">
              <Button variant="outline">Back to Proposals</Button>
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}