-- ============================================================================
-- Lumnix — Consolidated Database Schema
-- Generated: 2026-04-07
-- Run in: Supabase SQL Editor (https://supabase.com/dashboard/project/spzlhlurwwazuxgwwpqu/sql/new)
--
-- This file consolidates all 18 incremental migration files into one
-- authoritative schema. Use this for fresh deployments.
-- For existing databases, the original migration files remain valid.
-- ============================================================================

-- ============================================================================
-- 1. CORE TABLES
-- ============================================================================

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_color TEXT DEFAULT '#7C3AED',
  logo_url TEXT,
  slack_webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workspace members (team)
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  invite_token UUID DEFAULT gen_random_uuid(),
  invite_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Legacy alias: team_members (some RLS policies reference this)
-- If your DB uses team_members instead of workspace_members, rename accordingly.
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- ============================================================================
-- 2. INTEGRATIONS & AUTH
-- ============================================================================

-- Connected integrations (GSC, GA4, Google Ads, Meta Ads)
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT,
  display_name TEXT,
  status TEXT DEFAULT 'connected',
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  oauth_meta JSONB,
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
  last_refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. ANALYTICS DATA
-- ============================================================================

-- Generic analytics data cache (JSONB — used for Google Ads + Meta Ads sync)
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

-- GSC raw data (normalized rows)
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

-- GA4 raw data (normalized rows)
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

-- Google Ads data (per-campaign daily metrics)
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

-- Meta Ads data (per-campaign daily metrics)
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

-- Sync jobs (tracks sync execution history)
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

-- ============================================================================
-- 4. COMPETITOR INTELLIGENCE
-- ============================================================================

-- Competitors (basic domain tracking)
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Competitor brands (ad spy + monitoring)
CREATE TABLE IF NOT EXISTS competitor_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  fb_page_id TEXT,
  scrape_status TEXT DEFAULT 'idle',
  spy_score INT DEFAULT 0,
  active_ads_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI analysis of competitor ads
CREATE TABLE IF NOT EXISTS ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES competitor_brands(id) ON DELETE CASCADE,
  hook_patterns JSONB,
  messaging_angles JSONB,
  offer_mechanics JSONB,
  visual_style TEXT,
  ads_analysed_count INT DEFAULT 0,
  raw_output TEXT,
  spend_estimate TEXT,
  strategy_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Generated ad ideas from competitor analysis
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

-- Competitor change alerts
CREATE TABLE IF NOT EXISTS change_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES competitor_brands(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,
  description TEXT NOT NULL,
  notified_at TIMESTAMPTZ,
  seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Competitor ad trends (daily snapshots)
CREATE TABLE IF NOT EXISTS competitor_ad_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID NOT NULL REFERENCES competitor_brands(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_ads INT DEFAULT 0,
  active_ads INT DEFAULT 0,
  new_ads_today INT DEFAULT 0,
  paused_today INT DEFAULT 0,
  estimated_spend_lower NUMERIC,
  estimated_spend_upper NUMERIC,
  top_platforms JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competitor_id, snapshot_date)
);

-- Competitor website snapshots (change monitoring)
CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL,
  snapshot_data JSONB NOT NULL,
  changes JSONB,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keyword gaps (competitor keyword gap analysis)
CREATE TABLE IF NOT EXISTS keyword_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  competitor_url TEXT,
  difficulty TEXT CHECK (difficulty IN ('low', 'medium', 'high')),
  recommended_action TEXT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. AI & INSIGHTS
-- ============================================================================

-- AI-generated insights
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metric TEXT,
  change TEXT,
  action TEXT,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI anomaly detection
CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('traffic_drop', 'traffic_spike', 'ranking_drop', 'ranking_gain', 'ctr_drop', 'no_data')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_pages JSONB DEFAULT '[]'::jsonb,
  metric_before NUMERIC,
  metric_after NUMERIC,
  change_pct NUMERIC,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- AI recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_url TEXT,
  is_dismissed BOOLEAN DEFAULT false,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI traffic predictions
CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  forecast_data JSONB NOT NULL DEFAULT '[]',
  narrative TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. ALERTS & MONITORING
-- ============================================================================

-- Alert rules
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  threshold NUMERIC NOT NULL,
  comparison TEXT NOT NULL CHECK (comparison IN ('above', 'below', 'equals')),
  recipient_email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alert history
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metric_value NUMERIC,
  message TEXT
);

-- ============================================================================
-- 7. ATTRIBUTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS attribution_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  touchpoints JSONB NOT NULL DEFAULT '[]',
  conversion_value NUMERIC NOT NULL DEFAULT 0,
  converted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8. REPORTS & USAGE
-- ============================================================================

-- Scheduled report configuration
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  recipients TEXT[] NOT NULL DEFAULT '{}',
  report_config JSONB NOT NULL DEFAULT '{}',
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI chat usage tracking
CREATE TABLE IF NOT EXISTS chat_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. INDEXES
-- ============================================================================

-- GSC
CREATE INDEX IF NOT EXISTS gsc_data_workspace_date ON gsc_data(workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS gsc_data_query ON gsc_data(workspace_id, query);
CREATE INDEX IF NOT EXISTS idx_gsc_data_workspace_date ON gsc_data(workspace_id, date);
CREATE INDEX IF NOT EXISTS idx_gsc_data_workspace_clicks ON gsc_data(workspace_id, clicks DESC);

-- GA4
CREATE INDEX IF NOT EXISTS ga4_data_workspace_date ON ga4_data(workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS ga4_data_metric ON ga4_data(workspace_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_ga4_data_workspace_date ON ga4_data(workspace_id, date);
CREATE INDEX IF NOT EXISTS idx_ga4_data_workspace_metric ON ga4_data(workspace_id, metric_type, date);

-- Google Ads
CREATE INDEX IF NOT EXISTS idx_google_ads_data_workspace ON google_ads_data(workspace_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_data_date ON google_ads_data(workspace_id, date);

-- Meta Ads
CREATE INDEX IF NOT EXISTS idx_meta_ads_data_workspace ON meta_ads_data(workspace_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_data_date ON meta_ads_data(workspace_id, date);

-- Analytics data
CREATE INDEX IF NOT EXISTS idx_analytics_data_workspace_provider ON analytics_data(workspace_id, provider, date_range_start);

-- Integrations
CREATE INDEX IF NOT EXISTS idx_integrations_workspace_status ON integrations(workspace_id, status);

-- Workspace members
CREATE INDEX IF NOT EXISTS idx_workspace_members_invite_token ON workspace_members(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workspace_members_status ON workspace_members(status);

-- Competitors
CREATE INDEX IF NOT EXISTS idx_ad_trends_competitor_date ON competitor_ad_trends(competitor_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_competitor ON competitor_snapshots(competitor_id, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_gaps_workspace ON keyword_gaps(workspace_id, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_gaps_competitor ON keyword_gaps(competitor_id);

-- AI / Insights
CREATE INDEX IF NOT EXISTS idx_ai_insights_workspace ON ai_insights(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_workspace ON anomalies(workspace_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_unread ON anomalies(workspace_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_anomalies_workspace_date ON anomalies(workspace_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_workspace ON recommendations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_active ON recommendations(workspace_id, is_dismissed) WHERE is_dismissed = false;
CREATE INDEX IF NOT EXISTS idx_predictions_workspace ON predictions(workspace_id);

-- Alerts
CREATE INDEX IF NOT EXISTS idx_alert_rules_workspace ON alert_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alert_history_rule ON alert_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered ON alert_history(triggered_at);

-- Attribution
CREATE INDEX IF NOT EXISTS idx_attribution_workspace ON attribution_data(workspace_id);
CREATE INDEX IF NOT EXISTS idx_attribution_channel ON attribution_data(channel);
CREATE INDEX IF NOT EXISTS idx_attribution_converted ON attribution_data(converted_at);

-- Reports & Usage
CREATE INDEX IF NOT EXISTS idx_report_schedules_workspace ON report_schedules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_send ON report_schedules(next_send_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_chat_usage_workspace_date ON chat_usage(workspace_id, created_at);

-- ============================================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ga4_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ads_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_ad_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_usage ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11. RLS POLICIES
-- ============================================================================

-- Helper pattern: workspace access check
-- Most policies use: workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
-- OR: workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())

-- Workspaces
CREATE POLICY "workspace_owner" ON workspaces FOR ALL
  USING (owner_id = auth.uid());
CREATE POLICY "workspace_member_read" ON workspaces FOR SELECT
  USING (id IN (SELECT workspace_id FROM team_members WHERE user_id = auth.uid()));

-- Team members
CREATE POLICY "team_member_access" ON team_members FOR ALL
  USING (user_id = auth.uid() OR workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

-- Integrations
CREATE POLICY "integration_access" ON integrations FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    OR workspace_id IN (SELECT workspace_id FROM team_members WHERE user_id = auth.uid()));

-- OAuth tokens
CREATE POLICY "token_access" ON oauth_tokens FOR ALL
  USING (integration_id IN (SELECT id FROM integrations WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())));

-- Analytics data
CREATE POLICY "analytics_access" ON analytics_data FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    OR workspace_id IN (SELECT workspace_id FROM team_members WHERE user_id = auth.uid()));

-- GSC data
CREATE POLICY "gsc_data_access" ON gsc_data FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    OR workspace_id IN (SELECT workspace_id FROM team_members WHERE user_id = auth.uid()));

-- GA4 data
CREATE POLICY "ga4_data_access" ON ga4_data FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    OR workspace_id IN (SELECT workspace_id FROM team_members WHERE user_id = auth.uid()));

-- Google Ads data
CREATE POLICY "google_ads_data_access" ON google_ads_data FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Meta Ads data
CREATE POLICY "meta_ads_data_access" ON meta_ads_data FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Sync jobs
CREATE POLICY "sync_jobs_access" ON sync_jobs FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

-- Competitors
CREATE POLICY "competitor_access" ON competitors FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    OR workspace_id IN (SELECT workspace_id FROM team_members WHERE user_id = auth.uid()));

-- Competitor brands, analysis, ideas, alerts
CREATE POLICY "ai_analysis_workspace" ON ai_analysis FOR ALL
  USING (competitor_id IN (SELECT id FROM competitor_brands WHERE workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));

CREATE POLICY "ad_ideas_workspace" ON ad_ideas FOR ALL
  USING (competitor_id IN (SELECT id FROM competitor_brands WHERE workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));

CREATE POLICY "change_alerts_workspace" ON change_alerts FOR ALL
  USING (competitor_id IN (SELECT id FROM competitor_brands WHERE workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));

-- AI Insights
CREATE POLICY "insights_policy" ON ai_insights FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Anomalies
CREATE POLICY "anomalies_select" ON anomalies FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "anomalies_service" ON anomalies FOR ALL
  USING (true) WITH CHECK (true);

-- Keyword gaps
CREATE POLICY "keyword_gaps_select" ON keyword_gaps FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "keyword_gaps_service" ON keyword_gaps FOR ALL
  USING (true) WITH CHECK (true);

-- Chat usage
CREATE POLICY "chat_usage_service" ON chat_usage FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 12. RPC FUNCTIONS
-- ============================================================================

-- GSC overview: aggregated clicks, impressions, CTR, position
CREATE OR REPLACE FUNCTION rpc_gsc_overview(
  p_workspace_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS TABLE(
  total_clicks BIGINT,
  total_impressions BIGINT,
  avg_ctr NUMERIC,
  avg_position NUMERIC,
  total_keywords BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(clicks), 0)::BIGINT AS total_clicks,
    COALESCE(SUM(impressions), 0)::BIGINT AS total_impressions,
    CASE WHEN SUM(impressions) > 0
      THEN ROUND((SUM(clicks)::NUMERIC / SUM(impressions)) * 100, 2)
      ELSE 0
    END AS avg_ctr,
    ROUND(AVG(position)::NUMERIC, 1) AS avg_position,
    COUNT(DISTINCT query)::BIGINT AS total_keywords
  FROM gsc_data
  WHERE workspace_id = p_workspace_id
    AND date >= p_date_from
    AND date <= p_date_to;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GA4 overview: aggregated sessions, users by source
CREATE OR REPLACE FUNCTION rpc_ga4_overview(
  p_workspace_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS TABLE(
  total_sessions BIGINT,
  total_users BIGINT,
  top_sources JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN metric_type = 'sessions' THEN value ELSE 0 END), 0)::BIGINT AS total_sessions,
    COALESCE(SUM(CASE WHEN metric_type = 'totalUsers' THEN value ELSE 0 END), 0)::BIGINT AS total_users,
    (
      SELECT jsonb_agg(row_to_json(s))
      FROM (
        SELECT dimension_value AS source, SUM(value)::BIGINT AS sessions
        FROM ga4_data
        WHERE workspace_id = p_workspace_id
          AND date >= p_date_from
          AND date <= p_date_to
          AND metric_type = 'sessions'
          AND dimension_name = 'sessionSource'
        GROUP BY dimension_value
        ORDER BY SUM(value) DESC
        LIMIT 10
      ) s
    ) AS top_sources
  FROM ga4_data
  WHERE workspace_id = p_workspace_id
    AND date >= p_date_from
    AND date <= p_date_to;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
