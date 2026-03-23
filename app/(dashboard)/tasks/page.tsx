export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default async function TasksPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Sign in to view tasks.</p>
      </section>
    );
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_at, clients(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <section className="rounded-lg border bg-card p-6">
      <h1 className="text-2xl font-semibold">Tasks</h1>
      <p className="mt-2 text-muted-foreground">Track action items and deadlines across projects.</p>

      {!tasks?.length ? (
        <p className="mt-6 text-sm text-muted-foreground">No tasks yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-md border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 font-medium">Priority</th>
                <th className="px-4 py-2 font-medium">Due Date</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const client = Array.isArray(task.clients) ? task.clients[0] : task.clients;

                return (
                  <tr key={task.id} className="border-t">
                    <td className="px-4 py-2 font-medium">{task.title}</td>
                    <td className="px-4 py-2">{client?.name ?? "-"}</td>
                    <td className="px-4 py-2 capitalize">{task.priority}</td>
                    <td className="px-4 py-2">{formatDate(task.due_at)}</td>
                    <td className="px-4 py-2 capitalize">{task.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
