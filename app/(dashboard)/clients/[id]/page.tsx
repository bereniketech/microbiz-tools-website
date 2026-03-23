"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, getProposalPricingAmount } from "@/lib/proposals";
import { cn } from "@/lib/utils";

interface ClientRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  notes: string | null;
  last_contact_at: string | null;
  created_at: string;
}

interface ProposalRecord {
  id: string;
  title: string;
  status: string;
  pricing: unknown;
  sent_at: string | null;
  created_at: string;
}

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  status: string;
  currency: string;
  total_amount: number;
  issued_at: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  method: string | null;
  paid_at: string;
  notes: string | null;
  invoice_id: string;
  invoice_number: string;
}

interface TaskRecord {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_at: string | null;
}

interface FollowUpRecord {
  id: string;
  status: string;
  due_at: string;
  completed_at: string | null;
  channel: string | null;
  message: string | null;
}

interface TimelineRecord {
  id: string;
  type: string;
  message: string;
  happened_at: string;
}

interface PageData {
  client: ClientRecord;
  active_deals: ProposalRecord[];
  proposals: ProposalRecord[];
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  tasks: TaskRecord[];
  follow_ups: FollowUpRecord[];
  timeline: TimelineRecord[];
  stats: {
    client_value: number;
    total_payments: number;
    paid_invoice_count: number;
    total_invoice_count: number;
    is_cold: boolean;
  };
}

function formatMoney(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(value));
}

function formatDate(value: string | null): string {
  if (!value) return "-";

  return new Date(value).toLocaleString();
}

function statusBadgeClass(status: string): string {
  if (["accepted", "paid", "completed"].includes(status)) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (["overdue", "failed", "cancelled"].includes(status)) {
    return "bg-rose-100 text-rose-800";
  }

  if (["due", "pending", "draft"].includes(status)) {
    return "bg-amber-100 text-amber-900";
  }

  return "bg-slate-100 text-slate-700";
}

export default function ClientProfilePage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;

  const [data, setData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [newNote, setNewNote] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${clientId}`);

      if (!response.ok) {
        setError("Client profile could not be loaded.");
        return;
      }

      const payload = (await response.json()) as { data: PageData };
      setData(payload.data);

      setName(payload.data.client.name);
      setEmail(payload.data.client.email ?? "");
      setPhone(payload.data.client.phone ?? "");
      setCompanyName(payload.data.client.company_name ?? "");
    } catch {
      setError("Client profile could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const notePreview = useMemo(() => {
    if (!data?.client.notes) return [];

    return data.client.notes.split("\n").filter(Boolean).reverse();
  }, [data?.client.notes]);

  async function saveContactInfo() {
    setIsSavingContact(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          company_name: companyName,
        }),
      });

      if (!response.ok) {
        setError("Contact details could not be saved.");
        return;
      }

      setSuccessMessage("Contact details saved.");
      await loadData();
    } catch {
      setError("Contact details could not be saved.");
    } finally {
      setIsSavingContact(false);
    }
  }

  async function addNote() {
    if (!newNote.trim()) {
      setError("Please enter a note before saving.");
      return;
    }

    setIsSavingNote(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });

      if (!response.ok) {
        setError("Note could not be saved.");
        return;
      }

      setNewNote("");
      setSuccessMessage("Note saved.");
      await loadData();
    } catch {
      setError("Note could not be saved.");
    } finally {
      setIsSavingNote(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Loading client profile...</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <p className="text-sm text-destructive">Client not found.</p>
        <Link href="/leads" className="mt-4 inline-flex">
          <Button variant="outline">Back to leads</Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{data.client.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Client profile and relationship history</p>
        </div>

        <div className="flex items-center gap-2">
          {data.stats.is_cold && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
              Cold Client
            </span>
          )}
          <Link href="/leads">
            <Button variant="outline">Back to leads</Button>
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-md border p-4">
          <h2 className="text-base font-semibold">Contact Info</h2>

          <div className="space-y-1.5">
            <Label htmlFor="client-name">Name</Label>
            <Input id="client-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-email">Email</Label>
            <Input id="client-email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-phone">Phone</Label>
            <Input id="client-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(555) 123-4567" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-company">Company</Label>
            <Input id="client-company" value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Company name" />
          </div>

          <p className="text-xs text-muted-foreground">Last contact: {formatDate(data.client.last_contact_at)}</p>

          <Button onClick={saveContactInfo} disabled={isSavingContact}>{isSavingContact ? "Saving..." : "Save Contact Info"}</Button>
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <h2 className="text-base font-semibold">Payment Status</h2>
          <p className="text-sm text-muted-foreground">Client value</p>
          <p className="text-2xl font-semibold">{formatMoney(data.stats.client_value)}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase text-muted-foreground">Payments</p>
              <p className="text-lg font-semibold">{data.stats.total_payments}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase text-muted-foreground">Paid invoices</p>
              <p className="text-lg font-semibold">{data.stats.paid_invoice_count}/{data.stats.total_invoice_count}</p>
            </div>
          </div>

          {data.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.payments.map((payment) => (
                <li key={payment.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{formatMoney(payment.amount)}</span>
                    <span className="text-muted-foreground">{formatDate(payment.paid_at)}</span>
                  </div>
                  <p className="text-muted-foreground">Invoice: {payment.invoice_number}</p>
                  <p className="text-muted-foreground">Method: {payment.method ?? "-"}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-md border p-4">
          <h2 className="text-base font-semibold">Active Deals</h2>
          {data.active_deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accepted proposals yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.active_deals.map((proposal) => (
                <li key={proposal.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{proposal.title}</p>
                    <span className="text-muted-foreground">{formatCurrency(getProposalPricingAmount(proposal.pricing))}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <h2 className="text-base font-semibold">Tasks</h2>
          {data.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks linked to this client.</p>
          ) : (
            <ul className="space-y-2">
              {data.tasks.map((task) => (
                <li key={task.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{task.title}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold uppercase", statusBadgeClass(task.status))}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground">Priority: {task.priority}</p>
                  <p className="text-muted-foreground">Due: {formatDate(task.due_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-md border p-4">
          <h2 className="text-base font-semibold">Proposals</h2>
          {data.proposals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No proposals yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.proposals.map((proposal) => (
                <li key={proposal.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{proposal.title}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold uppercase", statusBadgeClass(proposal.status))}>
                      {proposal.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground">Sent: {formatDate(proposal.sent_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <h2 className="text-base font-semibold">Invoices</h2>
          {data.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.invoices.map((invoice) => (
                <li key={invoice.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold uppercase", statusBadgeClass(invoice.status))}>
                      {invoice.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground">Amount: {formatMoney(invoice.total_amount, invoice.currency)}</p>
                  <p className="text-muted-foreground">Issued: {formatDate(invoice.issued_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-md border p-4">
          <h2 className="text-base font-semibold">Follow-Ups</h2>
          {data.follow_ups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No follow-ups linked to this client.</p>
          ) : (
            <ul className="space-y-2">
              {data.follow_ups.map((item) => (
                <li key={item.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{item.message ?? "Follow-up"}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold uppercase", statusBadgeClass(item.status))}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground">Due: {formatDate(item.due_at)}</p>
                  <p className="text-muted-foreground">Channel: {item.channel ?? "-"}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <h2 className="text-base font-semibold">Notes</h2>
          <textarea
            className="min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
            placeholder="Add a note and save to timeline"
          />
          <Button onClick={addNote} disabled={isSavingNote}>{isSavingNote ? "Saving..." : "Add Note"}</Button>

          <div className="rounded-md border p-3">
            <p className="text-xs uppercase text-muted-foreground">Stored notes</p>
            {notePreview.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {notePreview.slice(0, 6).map((noteLine, index) => (
                  <li key={`${index}-${noteLine.slice(0, 12)}`} className="rounded bg-muted/50 p-2">
                    {noteLine}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <h2 className="text-base font-semibold">Activity Timeline</h2>
        {data.timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">No timeline events yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.timeline.map((event) => (
              <li key={event.id} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{event.message}</p>
                  <span className="text-muted-foreground">{formatDate(event.happened_at)}</span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{event.type.replaceAll("_", " ")}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
