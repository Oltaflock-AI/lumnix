-- KRATO — Full Database Migration
-- Run this in Supabase SQL Editor after creating the project

-- ============================================================
-- NEW ADDITIONS (run these if you already ran the migration):
-- ============================================================
-- ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS logo_url TEXT;
-- ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#7c3aed';
-- ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
--
-- CREATE TABLE IF NOT EXISTS public.ga4_data (
--   id uuid default gen_random_uuid() PRIMARY KEY,
--   workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
--   date date,
--   metric_type text,
--   dimension_name text,
--   dimension_value text,
--   value numeric,
--   created_at timestamptz default now()
-- );
-- CREATE TABLE IF NOT EXISTS public.gsc_data (
--   id uuid default gen_random_uuid() PRIMARY KEY,
--   workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
--   date date,
--   query text,
--   page text,
--   clicks int,
--   impressions int,
--   ctr numeric,
--   position numeric,
--   created_at timestamptz default now()
-- );
--
-- Storage bucket for brand assets (run in Supabase Dashboard > Storage):
-- Create a public bucket named: brand-assets
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workspaces (multi-tenant)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial','starter','pro','enterprise')),
  logo_url TEXT,
  brand_color TEXT DEFAULT '#7c3aed',
  slug TEXT UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workspace Members
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner','admin','member','viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Integrations
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gsc','ga4','google_ads','meta_ads','gbp','linkedin')),
  provider_account_id TEXT,
  display_name TEXT,
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected','revoked','error','syncing')),
  oauth_meta JSONB DEFAULT '{}'::jsonb,
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- OAuth Tokens
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[],
  last_refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sync Jobs
CREATE TABLE IF NOT EXISTS public.sync_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('backfill','hourly','daily','manual','webhook')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed')),
  attempts INT DEFAULT 0,
  payload JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GSC Data
CREATE TABLE IF NOT EXISTS public.gsc_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  query TEXT,
  page TEXT,
  country TEXT,
  device TEXT,
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  ctr NUMERIC(8,4) DEFAULT 0,
  position NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gsc_workspace_date ON public.gsc_data(workspace_id, date);
CREATE INDEX IF NOT EXISTS idx_gsc_query ON public.gsc_data(workspace_id, query);

-- GA4 Data
CREATE TABLE IF NOT EXISTS public.ga4_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  dimension_name TEXT,
  dimension_value TEXT,
  value NUMERIC(16,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ga4_workspace_date ON public.ga4_data(workspace_id, date);

-- Google Ads Data
CREATE TABLE IF NOT EXISTS public.google_ads_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  campaign_id TEXT,
  campaign_name TEXT,
  ad_group_id TEXT,
  ad_group_name TEXT,
  keyword TEXT,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  cost NUMERIC(12,2) DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  quality_score INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gads_workspace_date ON public.google_ads_data(workspace_id, date);

-- Meta Ads Data
CREATE TABLE IF NOT EXISTS public.meta_ads_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  campaign_id TEXT,
  campaign_name TEXT,
  adset_id TEXT,
  adset_name TEXT,
  ad_id TEXT,
  ad_name TEXT,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  conversions INT DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  reach INT DEFAULT 0,
  frequency NUMERIC(8,2) DEFAULT 0,
  cpm NUMERIC(8,2) DEFAULT 0,
  cpc NUMERIC(8,2) DEFAULT 0,
  ctr NUMERIC(8,4) DEFAULT 0,
  roas NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meta_workspace_date ON public.meta_ads_data(workspace_id, date);

-- Alerts
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  metric TEXT NOT NULL,
  condition JSONB NOT NULL,
  channels JSONB DEFAULT '[]'::jsonb,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Alert Events
CREATE TABLE IF NOT EXISTS public.alert_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active' CHECK (status IN ('active','acknowledged','resolved')),
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  schedule TEXT,
  recipients JSONB DEFAULT '[]'::jsonb,
  white_label BOOLEAN DEFAULT false,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Competitors
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  facebook_page_id TEXT,
  status TEXT DEFAULT 'active',
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Competitor Ads
CREATE TABLE IF NOT EXISTS public.competitor_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  platform TEXT DEFAULT 'meta',
  ad_id TEXT,
  creative_text TEXT,
  creative_media JSONB DEFAULT '[]'::jsonb,
  landing_page_url TEXT,
  landing_page_screenshot TEXT,
  impressions_range TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga4_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ads_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_ads ENABLE ROW LEVEL SECURITY;

-- RLS Policies — workspace-scoped access
CREATE POLICY "workspace_member_select" ON public.workspaces FOR SELECT USING (
  id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
);
CREATE POLICY "workspace_insert" ON public.workspaces FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "workspace_update" ON public.workspaces FOR UPDATE USING (
  id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner','admin'))
);

CREATE POLICY "members_select" ON public.workspace_members FOR SELECT USING (user_id = auth.uid() OR workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "members_insert" ON public.workspace_members FOR INSERT WITH CHECK (true);

-- For data tables: access via workspace membership
CREATE POLICY "integrations_access" ON public.integrations FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "oauth_tokens_access" ON public.oauth_tokens FOR ALL USING (integration_id IN (SELECT id FROM public.integrations WHERE workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())));
CREATE POLICY "sync_jobs_access" ON public.sync_jobs FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "gsc_access" ON public.gsc_data FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "ga4_access" ON public.ga4_data FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "gads_access" ON public.google_ads_data FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "meta_access" ON public.meta_ads_data FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "alerts_access" ON public.alerts FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "alert_events_access" ON public.alert_events FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "reports_access" ON public.reports FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "ai_access" ON public.ai_conversations FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "competitors_access" ON public.competitors FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "competitor_ads_access" ON public.competitor_ads FOR ALL USING (competitor_id IN (SELECT id FROM public.competitors WHERE workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())));

-- ============================================================
-- COMPETITOR AD SPY — new tables (drop old competitors/competitor_ads first)
-- Run if upgrading from previous migration:
-- DROP TABLE IF EXISTS public.competitor_ads CASCADE;
-- DROP TABLE IF EXISTS public.competitors CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS public.competitor_brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  facebook_page_name TEXT,
  facebook_page_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_competitor_brands_workspace ON public.competitor_brands(workspace_id);

CREATE TABLE IF NOT EXISTS public.competitor_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  competitor_id UUID REFERENCES public.competitor_brands(id) ON DELETE CASCADE,
  ad_archive_id TEXT UNIQUE,
  ad_creative_body TEXT,
  ad_creative_link_title TEXT,
  ad_creative_link_description TEXT,
  page_name TEXT,
  funding_entity TEXT,
  ad_delivery_start_time TEXT,
  ad_delivery_stop_time TEXT,
  impressions_lower_bound INT,
  impressions_upper_bound INT,
  spend_lower_bound INT,
  spend_upper_bound INT,
  currency TEXT,
  platforms TEXT[],
  media_type TEXT,
  media_url TEXT,
  snapshot_url TEXT,
  ai_angle TEXT,
  ai_hook TEXT,
  ai_cta TEXT,
  ai_tone TEXT,
  ai_summary TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_competitor_ads_workspace ON public.competitor_ads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_competitor_ads_competitor ON public.competitor_ads(competitor_id);

ALTER TABLE public.competitor_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitor_brands_access" ON public.competitor_brands FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "competitor_ads_access_new" ON public.competitor_ads FOR ALL USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

-- Auto-create workspace on signup (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspaces (name, created_by)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Workspace') || '''s Workspace', NEW.id);
  
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES ((SELECT id FROM public.workspaces WHERE created_by = NEW.id ORDER BY created_at DESC LIMIT 1), NEW.id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
