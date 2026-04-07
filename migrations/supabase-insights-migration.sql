-- AI Insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  type text NOT NULL,        -- win / warning / opportunity / tip
  title text NOT NULL,
  description text NOT NULL,
  metric text,
  change text,
  action text,
  priority text DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY insights_policy ON ai_insights
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_ai_insights_workspace ON ai_insights(workspace_id, created_at DESC);
