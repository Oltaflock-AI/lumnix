-- Google Ads Data table — stores per-campaign daily metrics
CREATE TABLE IF NOT EXISTS google_ads_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
  customer_id TEXT NOT NULL,
  campaign_id TEXT,
  campaign_name TEXT,
  status TEXT,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  cost NUMERIC(12,2) DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  conversions_value NUMERIC(12,2) DEFAULT 0,
  ctr NUMERIC(8,4) DEFAULT 0,
  avg_cpc NUMERIC(10,2) DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_google_ads_data_workspace ON google_ads_data(workspace_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_data_date ON google_ads_data(workspace_id, date);

ALTER TABLE google_ads_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own workspace google_ads_data"
  ON google_ads_data FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
