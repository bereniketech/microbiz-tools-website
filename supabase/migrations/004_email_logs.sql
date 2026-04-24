-- Migration: 004_email_logs
-- Audit trail for all emails sent via Resend

CREATE TABLE IF NOT EXISTS email_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_type       text NOT NULL CHECK (entity_type IN ('invoice', 'proposal', 'reminder')),
  entity_id         uuid NOT NULL,
  recipient_email   text NOT NULL,
  resend_message_id text,
  status            text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  sent_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_logs_workspace_select" ON email_logs
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_email_logs_workspace_id ON email_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_entity ON email_logs(entity_type, entity_id);
