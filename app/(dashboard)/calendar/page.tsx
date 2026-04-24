"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "en-US": enUS },
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: { type: "task" | "followup"; href: string };
}

export default function CalendarPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const [tasksResult, followupsResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, due_at")
        .eq("user_id", user.id)
        .not("due_at", "is", null),
      supabase
        .from("follow_ups")
        .select("id, message, due_at")
        .eq("user_id", user.id)
        .not("due_at", "is", null),
    ]);

    const taskEvents: CalendarEvent[] = (tasksResult.data ?? []).map((t) => {
      const d = new Date(t.due_at!);
      return {
        id: `task-${t.id}`,
        title: `📋 ${t.title}`,
        start: d,
        end: d,
        resource: { type: "task", href: `/tasks/${t.id}` },
      };
    });

    const followupEvents: CalendarEvent[] = (followupsResult.data ?? []).map((f) => {
      const d = new Date(f.due_at!);
      return {
        id: `followup-${f.id}`,
        title: `📞 ${f.message ?? "Follow-up"}`,
        start: d,
        end: d,
        resource: { type: "followup", href: `/follow-ups/${f.id}` },
      };
    });

    setEvents([...taskEvents, ...followupEvents]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      router.push(event.resource.href);
    },
    [router]
  );

  // Memoize to avoid Calendar re-render
  const memoEvents = useMemo(() => events, [events]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <div className="flex gap-2">
          {(["month", "week"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-sm capitalize border transition-colors ${
                view === v ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading calendar…</p>
      ) : memoEvents.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No tasks or follow-ups scheduled — add one to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-background p-2" style={{ height: "600px" }}>
          <Calendar
            localizer={localizer}
            events={memoEvents}
            view={view}
            onView={setView}
            onSelectEvent={handleSelectEvent}
            startAccessor="start"
            endAccessor="end"
          />
        </div>
      )}
    </div>
  );
}
