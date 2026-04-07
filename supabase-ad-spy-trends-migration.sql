-- Ad spy trends: daily snapshot of competitor ad metrics
CREATE TABLE IF NOT EXISTS competitor_ad_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID NOT NULL REFERENCES competitor_brands(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_ads INT DEFAULT 0,
  active_ads INT DEFAULT 0,
  new_ads_today INT DEFAULT 0,
  paused_today INT DEFAULT 0,
  estimated_spend_lower NUMERIC, -- based on impression ranges
  estimated_spend_upper NUMERIC,
  top_platforms JSONB DEFAULT '[]', -- [{ platform: 'facebook', count: 10 }]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competitor_id, snapshot_date)
);

CREATE INDEX idx_ad_trends_competitor_date ON competitor_ad_trends(competitor_id, snapshot_date DESC);
ALTER TABLE competitor_ad_trends ENABLE ROW LEVEL SECURITY;

-- Add spend_estimate to ai_analysis
ALTER TABLE ai_analysis ADD COLUMN IF NOT EXISTS spend_estimate TEXT;
ALTER TABLE ai_analysis ADD COLUMN IF NOT EXISTS strategy_summary TEXT;
