"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClientOption {
  id: string;
  name: string;
  email: string | null;
  company_name: string | null;
}

interface InvoiceLineItemForm {
  name: string;
  qty: string;
  unit_price: string;
}

interface DefaultsResponse {
  data: {
    clients: ClientOption[];
    currency: string;
  };
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateTotals(items: InvoiceLineItemForm[], taxRate: number) {
  const subtotal = roundCurrency(
    items.reduce((sum, item) => {
      const qty = Number(item.qty) || 0;
      const unit = Number(item.unit_price) || 0;
      return sum + qty * unit;
    }, 0),
  );

  const taxAmount = roundCurrency((subtotal * taxRate) / 100);
  const total = roundCurrency(subtotal + taxAmount);

  return { subtotal, taxAmount, total };
}

function defaultDueDate() {
  const due = new Date();
  due.setDate(due.getDate() + 7);
  return due.toISOString().slice(0, 10);
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [currency, setCurrency] = useState("USD");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [taxRate, setTaxRate] = useState("0");
  const [lineItems, setLineItems] = useState<InvoiceLineItemForm[]>([{ name: "", qty: "1", unit_price: "0" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDefaults() {
      setIsLoadingDefaults(true);

      try {
        const response = await fetch("/api/invoices/defaults");
        if (!response.ok) {
          if (!cancelled) setError("Invoice defaults could not be loaded.");
          return;
        }

        const payload = (await response.json()) as DefaultsResponse;
        if (!cancelled) {
          setClients(payload.data.clients ?? []);
          setCurrency(payload.data.currency ?? "USD");
        }
      } catch {
        if (!cancelled) setError("Invoice defaults could not be loaded.");
      } finally {
        if (!cancelled) setIsLoadingDefaults(false);
      }
    }

    void loadDefaults();

    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => calculateTotals(lineItems, Number(taxRate) || 0), [lineItems, taxRate]);

  function updateLineItem(index: number, key: keyof InvoiceLineItemForm, value: string) {
    setLineItems((current) => current.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  function addLineItem() {
    setLineItems((current) => [...current, { name: "", qty: "1", unit_price: "0" }]);
  }

  function removeLineItem(index: number) {
    setLineItems((current) => {
      if (current.length === 1) return current;
      return current.filter((_, i) => i !== index);
    });
  }

  async function submitInvoice() {
    setError(null);

    if (!clientId) {
      setError("Please choose a client.");
      return;
    }

    if (!invoiceNumber.trim()) {
      setError("Invoice number is required.");
      return;
    }

    const cleanedItems = lineItems
      .map((item) => ({
        name: item.name.trim(),
        qty: Number(item.qty),
        unit_price: Number(item.unit_price),
      }))
      .filter((item) => item.name && Number.isFinite(item.qty) && Number.isFinite(item.unit_price) && item.qty > 0 && item.unit_price >= 0);

    if (cleanedItems.length === 0) {
      setError("Add at least one valid line item.");
      return;
    }

    setIsSubmitting(true);

    try {
      const dueDateIso = new Date(`${dueDate}T12:00:00`).toISOString();

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          invoice_number: invoiceNumber.trim(),
          currency,
          due_date: dueDateIso,
          tax_rate: Number(taxRate) || 0,
          line_items: cleanedItems,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(payload?.error?.message ?? "Invoice could not be created.");
        return;
      }

      const payload = (await response.json()) as { data: { id: string } };
      router.replace(`/invoices/${payload.data.id}`);
    } catch {
      setError("Invoice could not be created.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingDefaults) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Loading invoice builder...</p>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-lg border bg-card p-6">
      <div>
        <h1 className="text-2xl font-semibold">Create Invoice</h1>
        <p className="mt-1 text-sm text-muted-foreground">Add line items, set tax, and auto-calculate totals.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="invoice-client">Client</Label>
          <select
            id="invoice-client"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
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
          <Label htmlFor="invoice-number">Invoice Number</Label>
          <Input id="invoice-number" value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invoice-currency">Currency</Label>
          <Input id="invoice-currency" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} maxLength={3} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invoice-due-date">Due Date</Label>
          <Input id="invoice-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </div>
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Line Items</h2>
          <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div key={`line-item-${index}`} className="grid gap-2 md:grid-cols-[1fr_110px_150px_auto]">
              <Input
                value={item.name}
                onChange={(event) => updateLineItem(index, "name", event.target.value)}
                placeholder="Line item name"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.qty}
                onChange={(event) => updateLineItem(index, "qty", event.target.value)}
                placeholder="Qty"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.unit_price}
                onChange={(event) => updateLineItem(index, "unit_price", event.target.value)}
                placeholder="Unit price"
              />
              <Button type="button" variant="ghost" onClick={() => removeLineItem(index)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="invoice-tax-rate">Tax Rate (%)</Label>
          <Input
            id="invoice-tax-rate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={taxRate}
            onChange={(event) => setTaxRate(event.target.value)}
          />
        </div>

        <div className="ml-auto w-full max-w-sm space-y-2 rounded-md border p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>
              {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(totals.subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>
              {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(totals.taxAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
            <span>Total</span>
            <span>
              {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(totals.total)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={submitInvoice} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Invoice"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/invoices")}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
