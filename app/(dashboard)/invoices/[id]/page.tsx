"use client";

import { pdf } from "@react-pdf/renderer";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { renderInvoicePdf } from "@/lib/utils/pdf";
import { cn } from "@/lib/utils";

interface InvoiceLineItem {
  name: string;
  qty: number;
  unit_price: number;
}

interface InvoiceDetail {
  id: string;
  invoice_number: string;
  status: "pending" | "paid" | "overdue";
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  due_date: string | null;
  issued_at: string | null;
  paid_at: string | null;
  line_items: InvoiceLineItem[];
  clients?: { name: string | null; email: string | null } | Array<{ name: string | null; email: string | null }> | null;
  branding?: {
    currency?: string;
    brand_name?: string | null;
    brand_logo_url?: string | null;
  };
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function statusBadgeClass(status: InvoiceDetail["status"]) {
  if (status === "paid") return "bg-emerald-100 text-emerald-800";
  if (status === "overdue") return "bg-rose-100 text-rose-800";
  return "bg-amber-100 text-amber-900";
}

function getClientRecord(clients: InvoiceDetail["clients"]) {
  if (!clients) return null;
  return Array.isArray(clients) ? (clients[0] ?? null) : clients;
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadInvoice = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${params.id}`, { cache: "no-store" });

      if (!response.ok) {
        setError("Invoice could not be loaded.");
        return;
      }

      const payload = (await response.json()) as { data: InvoiceDetail };
      setInvoice(payload.data);
    } catch {
      setError("Invoice could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadInvoice();
  }, [loadInvoice]);

  const client = useMemo(() => getClientRecord(invoice?.clients), [invoice?.clients]);

  async function markPaid() {
    if (!invoice || invoice.status === "paid") return;

    setIsMarkingPaid(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pay`, { method: "POST" });

      if (!response.ok) {
        setError("Invoice could not be marked paid.");
        return;
      }

      setSuccess("Payment recorded and income updated.");
      await loadInvoice();
    } catch {
      setError("Invoice could not be marked paid.");
    } finally {
      setIsMarkingPaid(false);
    }
  }

  async function downloadPdf() {
    if (!invoice) return;

    setIsDownloadingPdf(true);
    setError(null);

    try {
      const invoiceDocument = renderInvoicePdf({
        invoiceNumber: invoice.invoice_number,
        status: invoice.status,
        issuedAt: invoice.issued_at,
        dueDate: invoice.due_date,
        currency: invoice.currency,
        clientName: client?.name ?? "Client",
        clientEmail: client?.email,
        brandName: invoice.branding?.brand_name ?? "MicroBiz Toolbox",
        lineItems: (invoice.line_items ?? []).map((item) => ({
          name: item.name,
          qty: Number(item.qty),
          unit_price: Number(item.unit_price),
        })),
        subtotal: Number(invoice.subtotal),
        taxRate: Number(invoice.tax_rate),
        taxAmount: Number(invoice.tax_amount),
        totalAmount: Number(invoice.total_amount),
      });

      const blob = await pdf(invoiceDocument).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = `${invoice.invoice_number}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("PDF could not be generated.");
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Loading invoice...</p>
      </section>
    );
  }

  if (!invoice) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <p className="text-sm text-destructive">Invoice not found.</p>
        <Link href="/invoices" className="mt-4 inline-flex">
          <Button variant="outline">Back to invoices</Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Invoice {invoice.invoice_number}</h1>
          <p className="mt-1 text-sm text-muted-foreground">View line items, track status, and record payment.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadPdf}
            disabled={isDownloadingPdf}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={markPaid}
            disabled={isMarkingPaid || invoice.status === "paid"}
            className={cn(buttonVariants({}))}
          >
            {invoice.status === "paid" ? "Paid" : isMarkingPaid ? "Marking Paid..." : "Mark Paid"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <div className="grid gap-4 rounded-md border p-4 md:grid-cols-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Status</p>
          <span className={cn("mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium", statusBadgeClass(invoice.status))}>{invoice.status}</span>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Client</p>
          <p className="mt-1 text-sm font-medium">{client?.name ?? "Unknown client"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Issued</p>
          <p className="mt-1 text-sm">{formatDate(invoice.issued_at)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Due</p>
          <p className="mt-1 text-sm">{formatDate(invoice.due_date)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Line Item</th>
              <th className="px-4 py-2 font-medium">Qty</th>
              <th className="px-4 py-2 font-medium">Unit Price</th>
              <th className="px-4 py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.line_items ?? []).map((item, index) => (
              <tr key={`${item.name}-${index}`} className="border-t">
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">{item.qty}</td>
                <td className="px-4 py-2">{formatCurrency(Number(item.unit_price), invoice.currency)}</td>
                <td className="px-4 py-2">{formatCurrency(Number(item.qty) * Number(item.unit_price), invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ml-auto w-full max-w-sm space-y-2 rounded-md border p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(Number(invoice.subtotal), invoice.currency)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Tax ({invoice.tax_rate}%)</span>
          <span>{formatCurrency(Number(invoice.tax_amount), invoice.currency)}</span>
        </div>
        <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(Number(invoice.total_amount), invoice.currency)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => router.push("/invoices")} className={cn(buttonVariants({ variant: "outline" }))}>
          Back to invoices
        </button>
      </div>
    </section>
  );
}
