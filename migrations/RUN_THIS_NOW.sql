-- Beta invite codes system
CREATE TABLE IF NOT EXISTS beta_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  plan TEXT DEFAULT 'beta',        -- plan to grant: 'beta', 'starter', 'growth'
  max_uses INT,                    -- null = unlimited
  uses INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_by TEXT,                 -- admin email who created it
  note TEXT,                       -- internal note ("agency batch", "twitter promo")
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beta_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_id UUID NOT NULL REFERENCES beta_invites(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_beta_invites_code ON beta_invites(code);
CREATE INDEX idx_beta_redemptions_invite ON beta_redemptions(invite_id);

ALTER TABLE beta_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_redemptions ENABLE ROW LEVEL SECURITY;

-- Service role only (admin access)
CREATE POLICY "beta_invites_service" ON beta_invites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "beta_redemptions_service" ON beta_redemptions FOR ALL USING (true) WITH CHECK (true);

-- Seed some initial beta invite codes
INSERT INTO beta_invites (code, plan, max_uses, note) VALUES
  ('LUMNIX-BETA-2026', 'beta', 100, 'General beta access code'),
  ('AGENCY-VIP', 'growth', 10, 'VIP agency partners'),
  ('EARLY-BIRD', 'starter', 50, 'Early bird access')
ON CONFLICT (code) DO NOTHING;
-- Creative Studio tables for Week 2

-- Creative boards (organize saved ads)
CREATE TABLE IF NOT EXISTS creative_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#7C3AED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved ads / creatives to boards
CREATE TABLE IF NOT EXISTS creative_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES creative_boards(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'meta_ad_library', 'manual_upload', 'generated'
  source_id TEXT,            -- external ID (e.g. Meta Ad Library ad ID)
  title TEXT,
  image_url TEXT,
  video_url TEXT,
  landing_page_url TEXT,
  ad_copy TEXT,
  cta TEXT,
  advertiser_name TEXT,
  platform TEXT,             -- 'facebook', 'instagram', 'google', etc.
  started_running DATE,      -- when the ad started (longevity tracking)
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',  -- AI-generated tags: hook type, format, style, etc.
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-generated creatives (ad copy, video scripts, briefs)
CREATE TABLE IF NOT EXISTS generated_creatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL,        -- 'ad_copy', 'video_script', 'creative_brief', 'image_concept'
  framework TEXT,            -- 'AIDA', 'PAS', 'hook_body_cta', 'BAB', etc.
  prompt TEXT,               -- what the user asked for
  output JSONB NOT NULL,     -- generated content (array of variations)
  brand_context TEXT,        -- brand info used for generation
  target_audience TEXT,
  data_context JSONB,        -- workspace data used (top keywords, best ads, etc.)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creative_boards_workspace ON creative_boards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_creative_saves_workspace ON creative_saves(workspace_id);
CREATE INDEX IF NOT EXISTS idx_creative_saves_board ON creative_saves(board_id);
CREATE INDEX IF NOT EXISTS idx_creative_saves_tags ON creative_saves USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_creative_saves_source ON creative_saves(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_generated_creatives_workspace ON generated_creatives(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_creatives_type ON generated_creatives(workspace_id, type);

-- RLS
ALTER TABLE creative_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_creatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creative_boards_access" ON creative_boards FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "creative_boards_service" ON creative_boards FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "creative_saves_access" ON creative_saves FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "creative_saves_service" ON creative_saves FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "generated_creatives_access" ON generated_creatives FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "generated_creatives_service" ON generated_creatives FOR ALL
  USING (true) WITH CHECK (true);
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
-- Week 4: Lumi Agent + Agency tables

-- Daily briefings
CREATE TABLE IF NOT EXISTS daily_briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  briefing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT NOT NULL,
  changes JSONB DEFAULT '[]',       -- [{ metric, direction, value, pct_change }]
  recommendations JSONB DEFAULT '[]', -- [{ action, reason, priority }]
  sent_email BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, briefing_date)
);

-- Agent action queue
CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,        -- 'pause_ad', 'adjust_budget', 'generate_creative', 'content_brief'
  title TEXT NOT NULL,
  description TEXT,
  reason TEXT,                       -- why Lumi suggests this
  status TEXT DEFAULT 'suggested',   -- 'suggested', 'approved', 'rejected', 'executed', 'failed'
  priority TEXT DEFAULT 'medium',
  action_data JSONB DEFAULT '{}',    -- params needed to execute
  result JSONB,                      -- execution result
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shareable client dashboards (agency white-label)
CREATE TABLE IF NOT EXISTS shared_dashboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  title TEXT,
  sections JSONB DEFAULT '["overview","seo","analytics","ads"]', -- which sections to show
  custom_logo_url TEXT,
  custom_brand_color TEXT,
  is_active BOOLEAN DEFAULT true,
  password_hash TEXT,                -- optional password protection
  expires_at TIMESTAMPTZ,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_briefings_workspace ON daily_briefings(workspace_id, briefing_date DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_workspace ON agent_actions(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_shared_dashboards_token ON shared_dashboards(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_dashboards_workspace ON shared_dashboards(workspace_id);

-- RLS
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_briefings_service" ON daily_briefings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "agent_actions_service" ON agent_actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "shared_dashboards_service" ON shared_dashboards FOR ALL USING (true) WITH CHECK (true);

-- Update billing prices to match sprint plan
-- (workspace.plan column values: 'free', 'starter', 'growth', 'agency')
