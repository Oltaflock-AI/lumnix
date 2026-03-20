-- Competitor Spy Migration
CREATE TABLE IF NOT EXISTS ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES competitor_brands(id) ON DELETE CASCADE,
  hook_patterns JSONB,
  messaging_angles JSONB,
  offer_mechanics JSONB,
  visual_style TEXT,
  ads_analysed_count INT DEFAULT 0,
  raw_output TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_analysis_workspace ON ai_analysis;
CREATE POLICY ai_analysis_workspace ON ai_analysis FOR ALL USING (
  competitor_id IN (SELECT id FROM competitor_brands WHERE workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ))
);

CREATE TABLE IF NOT EXISTS ad_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES competitor_brands(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES ai_analysis(id) ON DELETE CASCADE,
  hook TEXT,
  body_copy TEXT,
  cta TEXT,
  visual_direction TEXT,
  target_audience TEXT,
  counter_angle TEXT,
  status TEXT DEFAULT 'idea',
  rating INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE ad_ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ad_ideas_workspace ON ad_ideas;
CREATE POLICY ad_ideas_workspace ON ad_ideas FOR ALL USING (
  competitor_id IN (SELECT id FROM competitor_brands WHERE workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ))
);

CREATE TABLE IF NOT EXISTS change_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES competitor_brands(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,
  description TEXT NOT NULL,
  notified_at TIMESTAMPTZ,
  seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE change_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS change_alerts_workspace ON change_alerts;
CREATE POLICY change_alerts_workspace ON change_alerts FOR ALL USING (
  competitor_id IN (SELECT id FROM competitor_brands WHERE workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ))
);

ALTER TABLE competitor_brands ADD COLUMN IF NOT EXISTS scrape_status TEXT DEFAULT 'idle';
ALTER TABLE competitor_brands ADD COLUMN IF NOT EXISTS spy_score INT DEFAULT 0;
ALTER TABLE competitor_brands ADD COLUMN IF NOT EXISTS active_ads_count INT DEFAULT 0;
ALTER TABLE competitor_brands ADD COLUMN IF NOT EXISTS fb_page_id TEXT;
