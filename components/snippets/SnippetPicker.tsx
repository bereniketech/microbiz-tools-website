"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Snippet } from "@/types";

interface SnippetPickerProps {
  open: boolean;
  clientName: string;
  onClose: () => void;
  onInsert: (resolvedText: string) => void;
}

function resolveClientName(template: string, clientName: string): string {
  return template.replaceAll("{client_name}", clientName);
}

export function SnippetPicker({ open, clientName, onClose, onInsert }: SnippetPickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  const loadSnippets = useCallback(async () => {
    if (!open) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }

      const response = await fetch(`/api/snippets${params.size > 0 ? `?${params.toString()}` : ""}`);

      if (!response.ok) {
        setError("Could not load snippets.");
        return;
      }

      const payload = (await response.json()) as { data: Snippet[] };
      setSnippets(payload.data ?? []);
    } catch {
      setError("Could not load snippets.");
    } finally {
      setIsLoading(false);
    }
  }, [open, selectedCategory]);

  useEffect(() => {
    void loadSnippets();
  }, [loadSnippets]);

  const categories = useMemo(() => {
    const allCategories = snippets
      .map((snippet) => snippet.category?.trim())
      .filter((category): category is string => Boolean(category));

    return Array.from(new Set(allCategories));
  }, [snippets]);

  const visibleSnippets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return snippets.filter((snippet) => {
      if (!normalizedQuery) return true;

      return (
        snippet.title.toLowerCase().includes(normalizedQuery) ||
        snippet.body.toLowerCase().includes(normalizedQuery) ||
        (snippet.category ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [searchQuery, snippets]);

  async function selectSnippet(snippet: Snippet) {
    const resolvedText = resolveClientName(snippet.body, clientName || "there");

    try {
      await navigator.clipboard.writeText(resolvedText);
    } catch {
      // Clipboard can fail in some browsers or insecure contexts; insertion still proceeds.
    }

    onInsert(resolvedText);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Insert snippet</h2>
            <p className="text-sm text-muted-foreground">Search and insert reusable text. {"{client_name}"} is resolved automatically.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search title, body, or category"
            aria-label="Search snippets"
          />

          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
            aria-label="Filter snippets by category"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-4 max-h-[24rem] space-y-2 overflow-auto pr-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading snippets...</p>
          ) : visibleSnippets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No snippets found for this filter.</p>
          ) : (
            visibleSnippets.map((snippet) => {
              const resolvedPreview = resolveClientName(snippet.body, clientName || "there");

              return (
                <article key={snippet.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium">{snippet.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{snippet.category || "Uncategorized"}</p>
                    </div>
                    <Button size="sm" onClick={() => void selectSnippet(snippet)}>
                      Use
                    </Button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{resolvedPreview}</p>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
