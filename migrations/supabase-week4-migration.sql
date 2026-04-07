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
