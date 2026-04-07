-- Week 3: Campaign Launcher + Attribution tables

-- Campaigns managed through Lumnix
CREATE TABLE IF NOT EXISTS campaigns_managed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,            -- 'meta_ads', 'google_ads'
  platform_campaign_id TEXT,         -- ID returned by the platform after creation
  name TEXT NOT NULL,
  objective TEXT,                    -- 'CONVERSIONS', 'TRAFFIC', 'AWARENESS', etc.
  status TEXT DEFAULT 'draft',       -- 'draft', 'pending', 'active', 'paused', 'completed', 'error'
  budget_type TEXT DEFAULT 'daily',  -- 'daily', 'lifetime'
  budget_amount NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  targeting JSONB DEFAULT '{}',      -- audience targeting config
  creatives JSONB DEFAULT '[]',      -- array of creative IDs or ad content
  ad_copy TEXT,
  keywords TEXT[],                   -- for Google Search campaigns
  start_date DATE,
  end_date DATE,
  platform_response JSONB,           -- raw API response from platform
  error_message TEXT,
  launched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pixel events (first-party tracking)
CREATE TABLE IF NOT EXISTS pixel_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,           -- anonymous visitor ID (cookie-based)
  session_id TEXT,
  event_type TEXT NOT NULL,           -- 'pageview', 'click', 'conversion', 'custom'
  page_url TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  device_type TEXT,                   -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  country TEXT,
  conversion_type TEXT,               -- 'purchase', 'signup', 'lead', etc.
  conversion_value NUMERIC(12,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attribution touchpoints
CREATE TABLE IF NOT EXISTS attribution_touchpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  channel TEXT NOT NULL,              -- 'organic', 'paid_google', 'paid_meta', 'direct', 'referral', 'email'
  campaign_id TEXT,
  creative_id TEXT,
  source TEXT,
  medium TEXT,
  page_url TEXT,
  touch_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attribution conversions
CREATE TABLE IF NOT EXISTS attribution_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  conversion_type TEXT NOT NULL,      -- 'purchase', 'signup', 'lead'
  conversion_value NUMERIC(12,2) DEFAULT 0,
  attributed_to JSONB DEFAULT '{}',   -- { "first_click": { channel, campaign_id }, "last_click": {...}, "linear": [{...}] }
  model TEXT DEFAULT 'last_click',    -- which model was used
  touchpoint_count INT DEFAULT 0,
  converted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_managed_workspace ON campaigns_managed(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_managed_platform ON campaigns_managed(workspace_id, platform);
CREATE INDEX IF NOT EXISTS idx_campaigns_managed_status ON campaigns_managed(status);

CREATE INDEX IF NOT EXISTS idx_pixel_events_workspace ON pixel_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pixel_events_visitor ON pixel_events(visitor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pixel_events_type ON pixel_events(workspace_id, event_type);

CREATE INDEX IF NOT EXISTS idx_attribution_touchpoints_visitor ON attribution_touchpoints(visitor_id, touch_at);
CREATE INDEX IF NOT EXISTS idx_attribution_touchpoints_workspace ON attribution_touchpoints(workspace_id);

CREATE INDEX IF NOT EXISTS idx_attribution_conversions_workspace ON attribution_conversions(workspace_id, converted_at DESC);
CREATE INDEX IF NOT EXISTS idx_attribution_conversions_visitor ON attribution_conversions(visitor_id);

-- RLS
ALTER TABLE campaigns_managed ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_managed_service" ON campaigns_managed FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "pixel_events_service" ON pixel_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "attribution_touchpoints_service" ON attribution_touchpoints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "attribution_conversions_service" ON attribution_conversions FOR ALL USING (true) WITH CHECK (true);
