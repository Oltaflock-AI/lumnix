-- Lumnix DB Migration — run in Supabase SQL Editor
-- Project: spzlhlurwwazuxgwwpqu

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_color TEXT DEFAULT '#7C3AED',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Integrations (GSC, GA4, Meta, etc.)
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT,
  display_name TEXT,
  status TEXT DEFAULT 'connected',
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- OAuth tokens
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Analytics data cache
CREATE TABLE IF NOT EXISTS analytics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  data JSONB,
  date_range_start DATE,
  date_range_end DATE,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Competitors
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "workspace_owner" ON workspaces FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "workspace_member_read" ON workspaces FOR SELECT USING (id IN (SELECT workspace_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "team_member_access" ON team_members FOR ALL USING (user_id = auth.uid() OR workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY "integration_access" ON integrations FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()) OR workspace_id IN (SELECT workspace_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "token_access" ON oauth_tokens FOR ALL USING (integration_id IN (SELECT id FROM integrations WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())));
CREATE POLICY "analytics_access" ON analytics_data FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()) OR workspace_id IN (SELECT workspace_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "competitor_access" ON competitors FOR ALL USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()) OR workspace_id IN (SELECT workspace_id FROM team_members WHERE user_id = auth.uid()));
