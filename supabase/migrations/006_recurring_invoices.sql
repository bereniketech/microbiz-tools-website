CREATE TABLE IF NOT EXISTS recurring_invoice_schedules (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_invoice_id  uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  frequency            text NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly')),
  next_run_date        date NOT NULL,
  end_date             date,
  active               boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recurring_invoice_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_schedules_workspace" ON recurring_invoice_schedules
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_recurring_due ON recurring_invoice_schedules(next_run_date, active);
