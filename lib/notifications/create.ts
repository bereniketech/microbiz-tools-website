import { createClient as createSupabaseClient } from "@supabase/supabase-js";

interface NotificationPayload {
  workspaceId: string;
  userId: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(payload: NotificationPayload): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  const supabase = createSupabaseClient(url, key);

  await supabase.from("notifications").insert({
    workspace_id: payload.workspaceId,
    user_id: payload.userId,
    type: payload.type,
    message: payload.message,
    metadata: payload.metadata ?? {},
  });
}
