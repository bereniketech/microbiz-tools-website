"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ClientOption {
  id: string;
  name: string;
  company_name: string | null;
}

interface TaskClient {
  id: string;
  name: string | null;
  company_name: string | null;
}

interface TaskItem {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  client: TaskClient | null;
}

type TaskPriority = "low" | "medium" | "high";

interface TaskSectionProps {
  title: string;
  emptyMessage: string;
  tasks: TaskItem[];
  pendingTaskId: string | null;
  onComplete: (task: TaskItem) => Promise<void>;
  showCompletedMeta?: boolean;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function getPriorityRank(priority: string): number {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}

function isCompleted(status: string): boolean {
  return status === "completed";
}

function sortTasks(a: TaskItem, b: TaskItem): number {
  if (!a.due_at && !b.due_at) {
    return getPriorityRank(a.priority) - getPriorityRank(b.priority);
  }

  if (!a.due_at) return 1;
  if (!b.due_at) return -1;

  const dueDiff = new Date(a.due_at).getTime() - new Date(b.due_at).getTime();

  if (dueDiff !== 0) {
    return dueDiff;
  }

  return getPriorityRank(a.priority) - getPriorityRank(b.priority);
}

function sortCompletedTasks(a: TaskItem, b: TaskItem): number {
  const completedA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
  const completedB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
  return completedB - completedA;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "No due date";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateInputValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toIsoDateTime(value: string): string | null {
  if (!value) {
    return null;
  }

  return new Date(`${value}T12:00:00`).toISOString();
}

function getPriorityBadgeClass(priority: string): string {
  if (priority === "high") {
    return "bg-rose-100 text-rose-800";
  }

  if (priority === "medium") {
    return "bg-amber-100 text-amber-900";
  }

  return "bg-slate-100 text-slate-700";
}

function getClientLabel(client: TaskClient | null): string {
  if (!client) {
    return "No client";
  }

  return client.name ?? client.company_name ?? "View client";
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

function TaskSection({ title, emptyMessage, tasks, pendingTaskId, onComplete, showCompletedMeta = false }: TaskSectionProps) {
  return (
    <div className="space-y-3 rounded-xl border bg-card/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h2>
        <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">{tasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const overdue = !showCompletedMeta && task.due_at !== null && new Date(task.due_at).getTime() < new Date(new Date().setHours(0, 0, 0, 0)).getTime();

            return (
              <article
                key={task.id}
                className={cn(
                  "rounded-xl border bg-background p-4 shadow-sm",
                  overdue && "border-rose-300 bg-rose-50/40",
                  showCompletedMeta && "border-emerald-200 bg-emerald-50/30",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{task.title}</h3>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold uppercase", getPriorityBadgeClass(task.priority))}>
                        {task.priority}
                      </span>
                      {overdue && <span className="rounded-full bg-rose-200 px-2 py-0.5 text-xs font-semibold uppercase text-rose-900">Overdue</span>}
                    </div>

                    {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                  </div>

                  {!showCompletedMeta && (
                    <Button size="sm" onClick={() => void onComplete(task)} disabled={pendingTaskId === task.id}>
                      {pendingTaskId === task.id ? "Saving..." : "Complete"}
                    </Button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  {task.client ? (
                    <Link href={`/clients/${task.client.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                      {getClientLabel(task.client)}
                    </Link>
                  ) : (
                    <span>No linked client</span>
                  )}

                  <span>Due: {formatDate(task.due_at)}</span>

                  {showCompletedMeta && <span>Completed: {formatDate(task.completed_at)}</span>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TasksBoard() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");

  const loadTasks = useCallback(async () => {
    const response = await fetch("/api/tasks");

    if (response.status === 401) {
      setTasks([]);
      setError("Sign in to view tasks.");
      return;
    }

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, "Could not load tasks."));
    }

    const payload = (await response.json()) as { data: TaskItem[] };
    setTasks(payload.data ?? []);
  }, []);

  const loadClients = useCallback(async () => {
    const response = await fetch("/api/clients");

    if (response.status === 401) {
      setClients([]);
      return;
    }

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, "Could not load clients."));
    }

    const payload = (await response.json()) as { data: ClientOption[] };
    setClients(payload.data ?? []);
  }, []);

  const loadBoard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([loadTasks(), loadClients()]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, [loadClients, loadTasks]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const groupedTasks = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const activeTasks = tasks.filter((task) => !isCompleted(task.status));

    return {
      overdue: activeTasks.filter((task) => task.due_at !== null && new Date(task.due_at) < todayStart).sort(sortTasks),
      dueToday: activeTasks
        .filter((task) => {
          if (!task.due_at) {
            return false;
          }

          const dueAt = new Date(task.due_at);
          return dueAt >= todayStart && dueAt <= todayEnd;
        })
        .sort(sortTasks),
      upcoming: activeTasks
        .filter((task) => {
          if (!task.due_at) {
            return true;
          }

          return new Date(task.due_at) > todayEnd;
        })
        .sort(sortTasks),
      completed: tasks.filter((task) => isCompleted(task.status)).sort(sortCompletedTasks),
    };
  }, [tasks]);

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          client_id: clientId || null,
          priority,
          due_at: toIsoDateTime(dueDate),
        }),
      });

      if (!response.ok) {
        setError(await parseErrorMessage(response, "Task could not be created."));
        return;
      }

      const payload = (await response.json()) as { data: TaskItem };

      setTasks((current) => [payload.data, ...current]);
      setTitle("");
      setClientId("");
      setPriority("medium");
      setDueDate("");
      setSuccess("Task created.");
    } catch {
      setError("Task could not be created.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete(task: TaskItem) {
    const previousTasks = tasks;

    setPendingTaskId(task.id);
    setError(null);
    setSuccess(null);

    setTasks((current) =>
      current.map((entry) =>
        entry.id === task.id
          ? {
              ...entry,
              status: "completed",
              completed_at: new Date().toISOString(),
            }
          : entry,
      ),
    );

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!response.ok) {
        setTasks(previousTasks);
        setError(await parseErrorMessage(response, "Task could not be completed."));
        return;
      }

      const payload = (await response.json()) as { data: TaskItem };

      setTasks((current) => current.map((entry) => (entry.id === task.id ? payload.data : entry)));
      setSuccess(task.client_id ? "Task completed and logged to the client timeline." : "Task completed.");
    } catch {
      setTasks(previousTasks);
      setError("Task could not be completed.");
    } finally {
      setPendingTaskId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-2">
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Track deadlines, proposal follow-ups, and invoice payment checks in one place.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-[2fr_1.4fr_1fr_1fr_auto] lg:items-end" onSubmit={handleCreateTask}>
            <div className="space-y-2 lg:col-span-1">
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Send revised estimate" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-client">Client</Label>
              <select id="task-client" className={selectClassName} value={clientId} onChange={(event) => setClientId(event.target.value)}>
                <option value="">No linked client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
                className={selectClassName}
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due date</Label>
              <Input id="task-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add task"}
            </Button>
          </form>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          {success && <p className="mt-4 text-sm text-emerald-700">{success}</p>}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Loading tasks...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <TaskSection
            title="Overdue"
            emptyMessage="Nothing overdue."
            tasks={groupedTasks.overdue}
            pendingTaskId={pendingTaskId}
            onComplete={handleComplete}
          />
          <TaskSection
            title="Due Today"
            emptyMessage="Nothing due today."
            tasks={groupedTasks.dueToday}
            pendingTaskId={pendingTaskId}
            onComplete={handleComplete}
          />
          <TaskSection
            title="Upcoming"
            emptyMessage="No upcoming tasks yet."
            tasks={groupedTasks.upcoming}
            pendingTaskId={pendingTaskId}
            onComplete={handleComplete}
          />
          <TaskSection
            title="Completed"
            emptyMessage="Completed tasks will appear here."
            tasks={groupedTasks.completed}
            pendingTaskId={pendingTaskId}
            onComplete={handleComplete}
            showCompletedMeta
          />
        </div>
      )}
    </div>
  );
}