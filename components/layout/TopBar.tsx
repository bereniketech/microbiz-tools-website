"use client";

import Link from "next/link";
import { Menu, Search, UserCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface TopBarProps {
  onToggleSidebar: () => void;
}

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

interface SearchPayload {
  clients: SearchResultItem[];
  proposals: SearchResultItem[];
  invoices: SearchResultItem[];
}

const EMPTY_RESULTS: SearchPayload = { clients: [], proposals: [], invoices: [] };

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchPayload>(EMPTY_RESULTS);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
    }

    void loadUser();
  }, [supabase]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults(EMPTY_RESULTS);
      setIsSearching(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);

        if (!response.ok) {
          setResults(EMPTY_RESULTS);
          return;
        }

        const payload: SearchPayload = await response.json();
        setResults(payload);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchTerm]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  async function onLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const groupedEntries = [
    { label: "Clients", items: results.clients },
    { label: "Proposals", items: results.proposals },
    { label: "Invoices", items: results.invoices },
  ];

  const hasResults = groupedEntries.some((entry) => entry.items.length > 0);

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
      <div className="flex items-center gap-3">
        <Button className="md:hidden" size="sm" variant="outline" onClick={onToggleSidebar}>
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <div className="relative flex-1" ref={containerRef}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onFocus={() => setIsDropdownOpen(true)}
            className="pl-9"
            placeholder="Search clients, proposals, invoices"
            type="search"
          />

          {isDropdownOpen && searchTerm.trim() && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 rounded-md border bg-popover p-2 shadow-md">
              {isSearching && <p className="px-2 py-1 text-sm text-muted-foreground">Searching...</p>}

              {!isSearching && !hasResults && <p className="px-2 py-1 text-sm text-muted-foreground">No matches found.</p>}

              {!isSearching &&
                groupedEntries.map((entry) => {
                  if (!entry.items.length) {
                    return null;
                  }

                  return (
                    <div key={entry.label} className="mb-2 last:mb-0">
                      <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{entry.label}</p>
                      <ul className="space-y-1">
                        {entry.items.map((item) => (
                          <li key={item.id}>
                            <Link
                              href={item.href}
                              className="block rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <span className="block font-medium">{item.title}</span>
                              {item.subtitle && <span className="block text-xs text-muted-foreground">{item.subtitle}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <UserCircle2 className="h-4 w-4" />
            <span className="max-w-[220px] truncate">{email ?? "Signed in"}</span>
          </div>
          <Button size="sm" variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
