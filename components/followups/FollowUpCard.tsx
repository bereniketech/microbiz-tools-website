import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

type FollowUpStatus = "waiting" | "due" | "replied" | "ghosted";

export interface FollowUpItem {
  id: string;
  status: FollowUpStatus;
  due_at: string;
  completed_at: string | null;
  channel: string | null;
  message: string | null;
  client_id: string | null;
  lead_id: string | null;
  proposal_id: string | null;
  created_at: string;
  updated_at: string;
  display_name: string;
}

interface FollowUpCardProps {
  item: FollowUpItem;
  timezone: string;
  isSaving: boolean;
  onFollowUp: (item: FollowUpItem) => void;
  onSetStatus: (item: FollowUpItem, nextStatus: FollowUpStatus) => void;
}

function statusClass(status: FollowUpStatus): string {
  if (status === "due") return "bg-amber-100 text-amber-900";
  if (status === "waiting") return "bg-blue-100 text-blue-900";
  if (status === "ghosted") return "bg-slate-200 text-slate-700";
  return "bg-emerald-100 text-emerald-800";
}

function statusLabel(status: FollowUpStatus): string {
  if (status === "due") return "Due";
  if (status === "waiting") return "Waiting";
  if (status === "ghosted") return "Ghosted";
  return "Replied";
}

export function FollowUpCard({ item, timezone, isSaving, onFollowUp, onSetStatus }: FollowUpCardProps) {
  return (
    <article className="rounded-md border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{item.display_name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.message ?? "Follow up and keep the conversation moving."}</p>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusClass(item.status))}>{statusLabel(item.status)}</span>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        <p>Due: {formatDate(item.due_at, timezone)}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onFollowUp(item)} disabled={isSaving}>
          Follow Up
        </Button>
        <Button size="sm" variant="outline" onClick={() => onSetStatus(item, "replied")} disabled={isSaving}>
          Replied
        </Button>
        <Button size="sm" variant="outline" onClick={() => onSetStatus(item, "ghosted")} disabled={isSaving}>
          Ghosted
        </Button>
      </div>
    </article>
  );
}