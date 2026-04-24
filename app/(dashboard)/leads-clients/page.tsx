"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useUserSettings } from "@/components/layout/UserSettingsProvider";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Tab = "leads" | "clients";

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

interface ClientListItem {
  id: string;
  name: string;
  email: string | null;
  company_name: string | null;
  total_revenue: number | null;
  created_at: string;
}

export default function LeadsClientsPage() {
  const { settings } = useUserSettings();
  const currency = settings?.currency ?? "USD";
  const timezone = settings?.timezone ?? "UTC";
  const [activeTab, setActiveTab] = useState<Tab>("leads");
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const [leadsResult, clientsResult] = await Promise.all([
      supabase
        .from("leads")
        .select("id, name, email, phone, service_needed, estimated_value, stage, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("clients")
        .select("id, name, email, company_name, total_revenue, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (leadsResult.error) {
      setError("Failed to load leads: " + leadsResult.error.message);
    } else {
      setLeads(leadsResult.data ?? []);
    }

    if (clientsResult.error) {
      setError("Failed to load clients: " + clientsResult.error.message);
    } else {
      setClients(clientsResult.data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads &amp; Clients</h1>
        <div className="flex gap-2">
          <a
            href="/api/export/csv?type=clients"
            download
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Export CSV
          </a>
          <Link href="/leads/new" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Add Lead
          </Link>
          <Link href="/clients/new" className={cn(buttonVariants({ size: "sm" }))}>
            Add Client
          </Link>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1 w-fit">
        {(["leads", "clients"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              activeTab === tab
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab} ({tab === "leads" ? leads.length : clients.length})
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-muted-foreground text-sm">Loading…</p>
      )}

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {!loading && !error && activeTab === "leads" && (
        leads.length === 0 ? (
          <p className="text-muted-foreground text-sm">No leads yet. Add your first lead to get started.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Contact</th>
                  <th className="px-4 py-3 text-left font-medium">Service</th>
                  <th className="px-4 py-3 text-left font-medium">Value</th>
                  <th className="px-4 py-3 text-left font-medium">Stage</th>
                  <th className="px-4 py-3 text-left font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                        {lead.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.email ?? lead.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.service_needed ?? "—"}</td>
                    <td className="px-4 py-3">
                      {lead.estimated_value != null ? formatCurrency(lead.estimated_value, currency) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border px-2 py-0.5 text-xs capitalize">{lead.stage}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(lead.created_at, timezone)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {!loading && !error && activeTab === "clients" && (
        clients.length === 0 ? (
          <p className="text-muted-foreground text-sm">No clients yet. Convert a lead or add a client directly.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Company</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Total Revenue</th>
                  <th className="px-4 py-3 text-left font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{client.company_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{client.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      {client.total_revenue != null ? formatCurrency(client.total_revenue, currency) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(client.created_at, timezone)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </section>
  );
}
