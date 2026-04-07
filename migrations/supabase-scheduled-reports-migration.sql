-- Scheduled reports
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly', -- daily, weekly, monthly
  recipients TEXT[] NOT NULL DEFAULT '{}',
  report_config JSONB NOT NULL DEFAULT '{}', -- which sections to include
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_schedules_workspace ON report_schedules(workspace_id);
CREATE INDEX idx_report_schedules_next_send ON report_schedules(next_send_at) WHERE enabled = true;

ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
