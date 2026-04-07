-- Lumnix Day 2 Migration — GSC data, GA4 data, sync jobs
-- Run in: https://supabase.com/dashboard/project/spzlhlurwwazuxgwwpqu/sql/new

-- Add missing columns to integrations
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS oauth_meta JSONB;

-- Add last_refreshed_at to oauth_tokens
ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMPTZ;

-- GSC raw data table
CREATE TABLE IF NOT EXISTS gsc_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  query TEXT,
  page TEXT,
  country TEXT,
  device TEXT,
  date DATE,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr FLOAT DEFAULT 0,
  position FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gsc_data_workspace_date ON gsc_data(workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS gsc_data_query ON gsc_data(workspace_id, query);
ALTER TABLE gsc_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gsc_data_access" ON gsc_data FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  OR workspace_id IN (SELECT workspace_id FROM team_members WHERE user_id = auth.uid())
);

-- GA4 raw data table
CREATE TABLE IF NOT EXISTS ga4_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  date DATE,
  metric_type TEXT,
  dimension_name TEXT,
  dimension_value TEXT,
  value FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ga4_data_workspace_date ON ga4_data(workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS ga4_data_metric ON ga4_data(workspace_id, metric_type);
ALTER TABLE ga4_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ga4_data_access" ON ga4_data FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  OR workspace_id IN (SELECT workspace_id FROM team_members WHERE user_id = auth.uid())
);

-- Sync jobs table
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  job_type TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_jobs_access" ON sync_jobs FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
);
