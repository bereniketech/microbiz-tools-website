"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClientListItem {
  id: string;
  name: string;
  email: string | null;
  company_name: string | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/clients");

      if (!response.ok) {
        setError("Could not load clients.");
        return;
      }

      const payload = (await response.json()) as { data: ClientListItem[] };
      setClients(payload.data);
    } catch {
      setError("Could not load clients.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">All clients and their contact information.</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export/csv?type=clients"
            download
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Export CSV
          </a>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading clients...</p>
      ) : clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">No clients found.</p>
      ) : (
        <ul className="space-y-2">
          {clients.map((client) => (
            <li key={client.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{client.name}</p>
                  {client.company_name && (
                    <p className="text-sm text-muted-foreground">{client.company_name}</p>
                  )}
                  {client.email && (
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  )}
                </div>
                <Link
                  href={`/clients/${client.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
