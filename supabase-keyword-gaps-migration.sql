-- Keyword gaps table for competitor keyword gap analysis
CREATE TABLE IF NOT EXISTS keyword_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  competitor_url TEXT,
  difficulty TEXT CHECK (difficulty IN ('low', 'medium', 'high')),
  recommended_action TEXT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_keyword_gaps_workspace ON keyword_gaps(workspace_id, analyzed_at DESC);
CREATE INDEX idx_keyword_gaps_competitor ON keyword_gaps(competitor_id);

-- RLS
ALTER TABLE keyword_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace keyword gaps"
  ON keyword_gaps FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access on keyword_gaps"
  ON keyword_gaps FOR ALL
  USING (true)
  WITH CHECK (true);
