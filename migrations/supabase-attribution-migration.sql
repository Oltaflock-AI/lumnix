-- Attribution migration: attribution_data table
-- Run this against your Supabase database

CREATE TABLE IF NOT EXISTS attribution_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  channel text NOT NULL,
  touchpoints jsonb NOT NULL DEFAULT '[]',
  conversion_value numeric NOT NULL DEFAULT 0,
  converted_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attribution_workspace ON attribution_data(workspace_id);
CREATE INDEX IF NOT EXISTS idx_attribution_channel ON attribution_data(channel);
CREATE INDEX IF NOT EXISTS idx_attribution_converted ON attribution_data(converted_at);

-- Enable RLS
ALTER TABLE attribution_data ENABLE ROW LEVEL SECURITY;
