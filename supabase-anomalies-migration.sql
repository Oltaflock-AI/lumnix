-- Anomalies table for AI anomaly detection
CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('traffic_drop', 'traffic_spike', 'ranking_drop', 'ranking_gain', 'ctr_drop', 'no_data')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_pages JSONB DEFAULT '[]'::jsonb,
  metric_before NUMERIC,
  metric_after NUMERIC,
  change_pct NUMERIC,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_anomalies_workspace ON anomalies(workspace_id, detected_at DESC);
CREATE INDEX idx_anomalies_unread ON anomalies(workspace_id, is_read) WHERE is_read = false;

-- RLS
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace anomalies"
  ON anomalies FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access on anomalies"
  ON anomalies FOR ALL
  USING (true)
  WITH CHECK (true);
