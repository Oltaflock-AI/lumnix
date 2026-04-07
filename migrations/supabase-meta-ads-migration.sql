-- Meta Ads Data table — stores per-campaign daily metrics
CREATE TABLE IF NOT EXISTS meta_ads_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
  account_id TEXT NOT NULL,
  campaign_id TEXT,
  campaign_name TEXT,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  reach BIGINT DEFAULT 0,
  ctr NUMERIC(8,4) DEFAULT 0,
  cpc NUMERIC(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meta_ads_data_workspace ON meta_ads_data(workspace_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_data_date ON meta_ads_data(workspace_id, date);

ALTER TABLE meta_ads_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own workspace meta_ads_data"
  ON meta_ads_data FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
