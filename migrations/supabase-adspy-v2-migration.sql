-- Competitor Ad Spy V2 Migration
-- Extends competitor_brands and rebuilds competitor_ads with longevity-based performance tiers

-- Extend competitor_brands table
ALTER TABLE competitor_brands ADD COLUMN IF NOT EXISTS facebook_page_id TEXT;
ALTER TABLE competitor_brands ADD COLUMN IF NOT EXISTS facebook_page_name_resolved TEXT;
ALTER TABLE competitor_brands ADD COLUMN IF NOT EXISTS facebook_page_url TEXT;
ALTER TABLE competitor_brands ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE competitor_brands ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE competitor_brands ADD COLUMN IF NOT EXISTS total_ads_found INTEGER DEFAULT 0;
ALTER TABLE competitor_brands ADD COLUMN IF NOT EXISTS winning_ads_count INTEGER DEFAULT 0;
ALTER TABLE competitor_brands ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ;

-- Drop old competitor_ads table if it exists and recreate with new schema
DROP TABLE IF EXISTS competitor_ads CASCADE;

CREATE TABLE competitor_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitor_brands(id) ON DELETE CASCADE,

  meta_ad_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT,

  -- ad content
  ad_copy TEXT,
  headline TEXT,
  description TEXT,
  call_to_action TEXT,
  ad_format TEXT, -- 'video' | 'image' | 'carousel'
  image_url TEXT,
  video_url TEXT,
  ad_snapshot_url TEXT,

  -- performance signal
  ad_delivery_start_time TIMESTAMPTZ,
  ad_delivery_stop_time TIMESTAMPTZ,
  days_running INTEGER,
  is_active BOOLEAN DEFAULT true,
  performance_tier TEXT, -- 'active' | 'winning' | 'top_performer'

  -- ai analysis
  ai_analyzed BOOLEAN DEFAULT false,
  ai_hook_type TEXT,
  ai_pain_point TEXT,
  ai_offer_structure TEXT,
  ai_visual_style TEXT,
  ai_cta_type TEXT,
  ai_summary TEXT,

  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(workspace_id, meta_ad_id)
);

-- AI-generated creative briefs per competitor
CREATE TABLE IF NOT EXISTS competitor_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitor_brands(id) ON DELETE CASCADE,

  -- brief content (Claude output)
  hook_patterns TEXT,
  pain_points TEXT,
  offer_structures TEXT,
  visual_themes TEXT,
  top_performing_formats TEXT,
  content_angles JSONB,
  raw_brief TEXT,

  ads_analyzed INTEGER,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE competitor_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_isolation_ads ON competitor_ads;
CREATE POLICY workspace_isolation_ads ON competitor_ads
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS workspace_isolation_briefs ON competitor_briefs;
CREATE POLICY workspace_isolation_briefs ON competitor_briefs
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_competitor_ads_competitor ON competitor_ads(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_ads_tier ON competitor_ads(performance_tier);
CREATE INDEX IF NOT EXISTS idx_competitor_ads_workspace ON competitor_ads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_competitor_briefs_competitor ON competitor_briefs(competitor_id);
