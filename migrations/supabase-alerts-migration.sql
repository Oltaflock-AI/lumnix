-- Alerts migration: alert_rules + alert_history tables
-- Run this against your Supabase database

-- Alert rules table
CREATE TABLE IF NOT EXISTS alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  metric text NOT NULL,
  threshold numeric NOT NULL,
  comparison text NOT NULL CHECK (comparison IN ('above', 'below', 'equals')),
  recipient_email text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Alert history table
CREATE TABLE IF NOT EXISTS alert_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  metric_value numeric,
  message text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alert_rules_workspace ON alert_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alert_history_rule ON alert_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered ON alert_history(triggered_at);

-- Enable RLS
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
