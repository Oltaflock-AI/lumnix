-- Competitor change monitoring
CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL,
  snapshot_data JSONB NOT NULL, -- { title, description, pages_count, content_hash }
  changes JSONB, -- detected changes from previous snapshot
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competitor_snapshots_competitor ON competitor_snapshots(competitor_id, snapshot_at DESC);
ALTER TABLE competitor_snapshots ENABLE ROW LEVEL SECURITY;
