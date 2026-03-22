"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Snippet } from "@/types";

type CategoryTab = "all" | "uncategorized" | string;

interface SnippetFormState {
  title: string;
  category: string;
  body: string;
}

const EMPTY_FORM: SnippetFormState = {
  title: "",
  category: "",
  body: "",
};

export default function SnippetsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
  const [form, setForm] = useState<SnippetFormState>(EMPTY_FORM);

  const loadSnippets = useCallback(async (category?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (category) {
        params.set("category", category);
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
  }, []);

  useEffect(() => {
    if (activeTab === "all" || activeTab === "uncategorized") {
      void loadSnippets();
      return;
    }

    void loadSnippets(activeTab);
  }, [activeTab, loadSnippets]);

  const categories = useMemo(() => {
    const values = snippets
      .map((snippet) => snippet.category?.trim())
      .filter((value): value is string => Boolean(value));

    return Array.from(new Set(values));
  }, [snippets]);

  const visibleSnippets = useMemo(() => {
    if (activeTab !== "uncategorized") return snippets;
    return snippets.filter((snippet) => !snippet.category?.trim());
  }, [activeTab, snippets]);

  function startCreate() {
    setEditingSnippetId(null);
    setForm(EMPTY_FORM);
    setSuccess(null);
    setError(null);
  }

  function startEdit(snippet: Snippet) {
    setEditingSnippetId(snippet.id);
    setForm({
      title: snippet.title,
      category: snippet.category ?? "",
      body: snippet.body,
    });
    setSuccess(null);
    setError(null);
  }

  async function saveSnippet(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(editingSnippetId ? `/api/snippets/${editingSnippetId}` : "/api/snippets", {
        method: editingSnippetId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          body: form.body,
        }),
      });

      if (!response.ok) {
        setError("Snippet could not be saved.");
        return;
      }

      setSuccess(editingSnippetId ? "Snippet updated." : "Snippet created.");
      setEditingSnippetId(null);
      setForm(EMPTY_FORM);
      await loadSnippets(activeTab !== "all" && activeTab !== "uncategorized" ? activeTab : undefined);
    } catch {
      setError("Snippet could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSnippet(id: string) {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/snippets/${id}`, { method: "DELETE" });

      if (!response.ok) {
        setError("Snippet could not be deleted.");
        return;
      }

      if (editingSnippetId === id) {
        setEditingSnippetId(null);
        setForm(EMPTY_FORM);
      }

      setSuccess("Snippet deleted.");
      await loadSnippets(activeTab !== "all" && activeTab !== "uncategorized" ? activeTab : undefined);
    } catch {
      setError("Snippet could not be deleted.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Snippets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Store reusable templates for follow-ups and proposals.</p>
        </div>
        <Button variant="outline" onClick={startCreate} disabled={isSaving}>
          New snippet
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {success && <p className="mt-4 text-sm text-emerald-700">{success}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant={activeTab === "all" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("all")}>
          All
        </Button>
        <Button
          variant={activeTab === "uncategorized" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("uncategorized")}
        >
          Uncategorized
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={activeTab === category ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="text-base font-semibold">Library</h2>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading snippets...</p>
          ) : visibleSnippets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No snippets in this category yet.</p>
          ) : (
            visibleSnippets.map((snippet) => (
              <article key={snippet.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{snippet.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{snippet.category || "Uncategorized"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(snippet)} disabled={isSaving}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void deleteSnippet(snippet.id)} disabled={isSaving}>
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{snippet.body}</p>
              </article>
            ))
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="text-base font-semibold">{editingSnippetId ? "Edit snippet" : "Create snippet"}</h2>
          <form className="mt-4 space-y-3" onSubmit={saveSnippet}>
            <div className="space-y-1">
              <label htmlFor="snippet-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="snippet-title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Gentle check-in"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="snippet-category" className="text-sm font-medium">
                Category (optional)
              </label>
              <Input
                id="snippet-category"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="follow-up"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="snippet-body" className="text-sm font-medium">
                Body
              </label>
              <textarea
                id="snippet-body"
                value={form.body}
                onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                rows={8}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Hi {client_name}, ..."
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {editingSnippetId ? "Save changes" : "Create snippet"}
              </Button>
              {editingSnippetId && (
                <Button type="button" variant="outline" onClick={startCreate} disabled={isSaving}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
