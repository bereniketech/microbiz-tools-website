"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useUserSettings } from "@/components/layout/UserSettingsProvider";
import { FollowUpCard, type FollowUpItem } from "@/components/followups/FollowUpCard";
import { SnippetPicker } from "@/components/snippets/SnippetPicker";
import { Button } from "@/components/ui/button";

type FollowUpStatus = "waiting" | "due" | "replied" | "ghosted";

function getTodayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function sortByDueDate(a: FollowUpItem, b: FollowUpItem): number {
  return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
}

export default function FollowUpsPage() {
  const { settings } = useUserSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isGhostedExpanded, setIsGhostedExpanded] = useState(false);
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [snippetTarget, setSnippetTarget] = useState<FollowUpItem | null>(null);

  const loadFollowUps = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/follow-ups");

      if (!response.ok) {
        setError("Could not load follow-ups.");
        return;
      }

      const payload = (await response.json()) as { data: FollowUpItem[] };
      setItems(payload.data ?? []);
    } catch {
      setError("Could not load follow-ups.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFollowUps();
  }, [loadFollowUps]);

  const columns = useMemo(() => {
    const { start, end } = getTodayBounds();

    const active = items.filter((item) => item.status !== "replied" && item.status !== "ghosted");

    return {
      overdue: active.filter((item) => new Date(item.due_at) < start).sort(sortByDueDate),
      today: active.filter((item) => {
        const dueAt = new Date(item.due_at);
        return dueAt >= start && dueAt <= end;
      }).sort(sortByDueDate),
      upcoming: active.filter((item) => new Date(item.due_at) > end).sort(sortByDueDate),
      ghosted: items.filter((item) => item.status === "ghosted").sort(sortByDueDate),
    };
  }, [items]);

  async function updateStatus(item: FollowUpItem, nextStatus: FollowUpStatus) {
    const previousItems = items;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: nextStatus } : entry)));

    try {
      const response = await fetch(`/api/follow-ups/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        setItems(previousItems);
        setError("Status could not be updated.");
        return;
      }

      const payload = (await response.json()) as { data: FollowUpItem };

      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, ...payload.data } : entry)));
      setSuccess(nextStatus === "replied" ? "Marked as replied and removed from active queue." : "Follow-up status updated.");
    } catch {
      setItems(previousItems);
      setError("Status could not be updated.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSnippetSelected(resolvedText: string) {
    setSuccess(null);

    try {
      await navigator.clipboard.writeText(resolvedText);
      setSuccess("Snippet text copied to clipboard.");
    } catch {
      setError("Snippet copied failed. Your browser may block clipboard access.");
    }
  }

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Follow-Ups</h1>
          <p className="mt-1 text-sm text-muted-foreground">Keep outreach and reminders on schedule.</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {success && <p className="mt-4 text-sm text-emerald-700">{success}</p>}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading follow-ups...</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="space-y-3 rounded-md border p-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Overdue</h2>
              {columns.overdue.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing overdue.</p>
              ) : (
                columns.overdue.map((item) => (
                  <FollowUpCard
                    key={item.id}
                    item={item}
                    timezone={settings.timezone}
                    isSaving={isSaving}
                    onFollowUp={setSnippetTarget}
                    onSetStatus={updateStatus}
                  />
                ))
              )}
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Due Today</h2>
              {columns.today.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing due today.</p>
              ) : (
                columns.today.map((item) => (
                  <FollowUpCard
                    key={item.id}
                    item={item}
                    timezone={settings.timezone}
                    isSaving={isSaving}
                    onFollowUp={setSnippetTarget}
                    onSetStatus={updateStatus}
                  />
                ))
              )}
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upcoming</h2>
              {columns.upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing upcoming.</p>
              ) : (
                columns.upcoming.map((item) => (
                  <FollowUpCard
                    key={item.id}
                    item={item}
                    timezone={settings.timezone}
                    isSaving={isSaving}
                    onFollowUp={setSnippetTarget}
                    onSetStatus={updateStatus}
                  />
                ))
              )}
            </div>
          </div>

          <div className="mt-6 rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ghosted</h2>
              <Button variant="outline" size="sm" onClick={() => setIsGhostedExpanded((prev) => !prev)}>
                {isGhostedExpanded ? "Collapse" : "Expand"}
              </Button>
            </div>

            {isGhostedExpanded && (
              <div className="mt-3 space-y-2">
                {columns.ghosted.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No ghosted follow-ups yet.</p>
                ) : (
                  columns.ghosted.map((item) => (
                    <FollowUpCard
                      key={item.id}
                      item={item}
                      timezone={settings.timezone}
                      isSaving={isSaving}
                      onFollowUp={setSnippetTarget}
                      onSetStatus={updateStatus}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}

      <SnippetPicker
        open={snippetTarget !== null}
        clientName={snippetTarget?.display_name ?? "there"}
        onClose={() => setSnippetTarget(null)}
        onInsert={handleSnippetSelected}
      />
    </section>
  );
}
