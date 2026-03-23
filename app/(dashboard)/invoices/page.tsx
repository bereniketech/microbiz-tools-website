"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useUserSettings } from "@/components/layout/UserSettingsProvider";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface InvoiceListItem {
  id: string;
  invoice_number: string;
  status: "pending" | "paid" | "overdue";
  currency: string;
  total_amount: number;
  due_date: string | null;
  clients?: { name: string | null } | Array<{ name: string | null }> | null;
}

const FILTERS = ["all", "pending", "paid", "overdue"] as const;

function getClientName(clients: InvoiceListItem["clients"]) {
  if (!clients) return "Unknown client";
  return Array.isArray(clients) ? (clients[0]?.name ?? "Unknown client") : (clients.name ?? "Unknown client");
}

function statusChipClass(status: InvoiceListItem["status"]) {
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "overdue") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function InvoicesPage() {
  const { settings } = useUserSettings();
  const [selectedFilter, setSelectedFilter] = useState<(typeof FILTERS)[number]>("all");
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices?status=${encodeURIComponent(selectedFilter)}`);

      if (!response.ok) {
        setError("Could not load invoices.");
        return;
      }

      const payload = (await response.json()) as { data: InvoiceListItem[] };
      setInvoices(payload.data ?? []);
    } catch {
      setError("Could not load invoices.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track pending, paid, and overdue invoices.</p>
        </div>

        <Link href="/invoices/new" className={cn(buttonVariants({}))}>
          New Invoice
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setSelectedFilter(filter)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm capitalize transition-colors",
              selectedFilter === filter ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent",
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading invoices...</p>
      ) : invoices.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No invoices in this filter.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-md border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Invoice #</th>
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 font-medium">Due Date</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Open</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{invoice.invoice_number}</td>
                  <td className="px-4 py-2">{getClientName(invoice.clients)}</td>
                  <td className="px-4 py-2">{formatDate(invoice.due_date, settings.timezone)}</td>
                  <td className="px-4 py-2">{formatCurrency(Number(invoice.total_amount), settings.currency || invoice.currency)}</td>
                  <td className="px-4 py-2">
                    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", statusChipClass(invoice.status))}>{invoice.status}</span>
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/invoices/${invoice.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      View
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
