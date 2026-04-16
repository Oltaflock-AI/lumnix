-- ============================================================================
-- Lumnix Security RLS Overhaul Migration
-- Created: 2026-04-16
-- Safe to re-run: fully idempotent, uses EXECUTE for tables that may not exist
-- ============================================================================

BEGIN;

-- ============================================================================
-- M2: MISSING INDEXES (core tables always exist)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competitor_brands') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_competitor_brands_workspace ON competitor_brands(workspace_id)';
  END IF;
END $$;


-- ============================================================================
-- L3: MISSING FK ON competitor_snapshots
-- ============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competitor_snapshots')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competitor_brands')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='fk_competitor_snapshots_brand' AND table_name='competitor_snapshots')
  THEN
    EXECUTE 'ALTER TABLE competitor_snapshots ADD CONSTRAINT fk_competitor_snapshots_brand FOREIGN KEY (competitor_id) REFERENCES competitor_brands(id) ON DELETE CASCADE';
  END IF;
END $$;


-- ============================================================================
-- PLAN CHECK CONSTRAINT on workspaces
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='valid_plan' AND table_name='workspaces') THEN
    ALTER TABLE workspaces ADD CONSTRAINT valid_plan CHECK (plan IN ('free','starter','growth','pro','agency','enterprise'));
  END IF;
END $$;


-- ============================================================================
-- C1: TABLES WITH RLS ENABLED BUT ZERO POLICIES
-- All use EXECUTE to avoid parse-time errors on missing tables
-- ============================================================================

-- Helper macro: workspace membership subquery (used in EXECUTE strings)
-- ws_check = workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())

-- competitor_brands
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competitor_brands') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='competitor_brands' AND policyname='competitor_brands_workspace_read') THEN
      EXECUTE 'CREATE POLICY "competitor_brands_workspace_read" ON competitor_brands FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='competitor_brands' AND policyname='competitor_brands_workspace_insert') THEN
      EXECUTE 'CREATE POLICY "competitor_brands_workspace_insert" ON competitor_brands FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='competitor_brands' AND policyname='competitor_brands_workspace_update') THEN
      EXECUTE 'CREATE POLICY "competitor_brands_workspace_update" ON competitor_brands FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='competitor_brands' AND policyname='competitor_brands_workspace_delete') THEN
      EXECUTE 'CREATE POLICY "competitor_brands_workspace_delete" ON competitor_brands FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
  END IF;
END $$;

-- competitor_ad_trends
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competitor_ad_trends') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='competitor_ad_trends' AND policyname='competitor_ad_trends_workspace_read') THEN
      EXECUTE 'CREATE POLICY "competitor_ad_trends_workspace_read" ON competitor_ad_trends FOR SELECT USING (competitor_id IN (SELECT id FROM competitor_brands WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='competitor_ad_trends' AND policyname='competitor_ad_trends_service') THEN
      EXECUTE 'CREATE POLICY "competitor_ad_trends_service" ON competitor_ad_trends FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;

-- competitor_snapshots
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='competitor_snapshots') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='competitor_snapshots' AND policyname='competitor_snapshots_workspace_read') THEN
      EXECUTE 'CREATE POLICY "competitor_snapshots_workspace_read" ON competitor_snapshots FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='competitor_snapshots' AND policyname='competitor_snapshots_service') THEN
      EXECUTE 'CREATE POLICY "competitor_snapshots_service" ON competitor_snapshots FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;

-- alert_rules
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='alert_rules') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alert_rules' AND policyname='alert_rules_workspace_access') THEN
      EXECUTE 'CREATE POLICY "alert_rules_workspace_access" ON alert_rules FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
  END IF;
END $$;

-- alert_history
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='alert_history') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alert_history' AND policyname='alert_history_workspace_read') THEN
      EXECUTE 'CREATE POLICY "alert_history_workspace_read" ON alert_history FOR SELECT USING (rule_id IN (SELECT id FROM alert_rules WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alert_history' AND policyname='alert_history_service') THEN
      EXECUTE 'CREATE POLICY "alert_history_service" ON alert_history FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;

-- attribution_data
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='attribution_data') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='attribution_data' AND policyname='attribution_data_workspace_read') THEN
      EXECUTE 'CREATE POLICY "attribution_data_workspace_read" ON attribution_data FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='attribution_data' AND policyname='attribution_data_service') THEN
      EXECUTE 'CREATE POLICY "attribution_data_service" ON attribution_data FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;

-- report_schedules
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='report_schedules') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='report_schedules' AND policyname='report_schedules_workspace_access') THEN
      EXECUTE 'CREATE POLICY "report_schedules_workspace_access" ON report_schedules FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
  END IF;
END $$;

-- recommendations
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='recommendations') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='recommendations' AND policyname='recommendations_workspace_read') THEN
      EXECUTE 'CREATE POLICY "recommendations_workspace_read" ON recommendations FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='recommendations' AND policyname='recommendations_workspace_update') THEN
      EXECUTE 'CREATE POLICY "recommendations_workspace_update" ON recommendations FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='recommendations' AND policyname='recommendations_service') THEN
      EXECUTE 'CREATE POLICY "recommendations_service" ON recommendations FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;

-- predictions
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='predictions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='predictions' AND policyname='predictions_workspace_read') THEN
      EXECUTE 'CREATE POLICY "predictions_workspace_read" ON predictions FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='predictions' AND policyname='predictions_service') THEN
      EXECUTE 'CREATE POLICY "predictions_service" ON predictions FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;

-- email_sequences
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='email_sequences') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_sequences' AND policyname='email_sequences_service_only') THEN
      EXECUTE 'CREATE POLICY "email_sequences_service_only" ON email_sequences FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;

-- email_preferences
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='email_preferences') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_preferences' AND policyname='email_preferences_service_only') THEN
      EXECUTE 'CREATE POLICY "email_preferences_service_only" ON email_preferences FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;


-- ============================================================================
-- C2 + M4: DROP OVERLY PERMISSIVE USING(true) POLICIES
-- ============================================================================

DO $$
DECLARE
  _drops text[] := ARRAY[
    'DROP POLICY IF EXISTS "anomalies_service" ON anomalies',
    'DROP POLICY IF EXISTS "keyword_gaps_service" ON keyword_gaps',
    'DROP POLICY IF EXISTS "creative_boards_service" ON creative_boards',
    'DROP POLICY IF EXISTS "creative_saves_service" ON creative_saves',
    'DROP POLICY IF EXISTS "generated_creatives_service" ON generated_creatives',
    'DROP POLICY IF EXISTS "campaigns_managed_service" ON campaigns_managed',
    'DROP POLICY IF EXISTS "pixel_events_service" ON pixel_events',
    'DROP POLICY IF EXISTS "attribution_touchpoints_service" ON attribution_touchpoints',
    'DROP POLICY IF EXISTS "attribution_conversions_service" ON attribution_conversions',
    'DROP POLICY IF EXISTS "daily_briefings_service" ON daily_briefings',
    'DROP POLICY IF EXISTS "agent_actions_service" ON agent_actions',
    'DROP POLICY IF EXISTS "shared_dashboards_service" ON shared_dashboards',
    'DROP POLICY IF EXISTS "beta_invites_service" ON beta_invites',
    'DROP POLICY IF EXISTS "beta_redemptions_service" ON beta_redemptions',
    'DROP POLICY IF EXISTS "Service role full access on waitlist" ON waitlist'
  ];
  _tbl text;
  _sql text;
BEGIN
  FOREACH _sql IN ARRAY _drops LOOP
    -- Extract table name (last word after ON)
    _tbl := split_part(_sql, ' ON ', 2);
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=_tbl) THEN
      EXECUTE _sql;
    END IF;
  END LOOP;
END $$;


-- ============================================================================
-- C2: REPLACE WITH PROPER WORKSPACE-SCOPED / SERVICE POLICIES
-- ============================================================================

-- anomalies: service write (workspace SELECT already exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='anomalies')
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='anomalies' AND policyname='anomalies_service_write') THEN
    EXECUTE 'CREATE POLICY "anomalies_service_write" ON anomalies FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;

-- keyword_gaps: service write (workspace SELECT already exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='keyword_gaps')
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='keyword_gaps' AND policyname='keyword_gaps_service_write') THEN
    EXECUTE 'CREATE POLICY "keyword_gaps_service_write" ON keyword_gaps FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;

-- campaigns_managed
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='campaigns_managed') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='campaigns_managed' AND policyname='campaigns_managed_workspace_access') THEN
      EXECUTE 'CREATE POLICY "campaigns_managed_workspace_access" ON campaigns_managed FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='campaigns_managed' AND policyname='campaigns_managed_service_role') THEN
      EXECUTE 'CREATE POLICY "campaigns_managed_service_role" ON campaigns_managed FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;

-- pixel_events
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pixel_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pixel_events' AND policyname='pixel_events_workspace_read') THEN
      EXECUTE 'CREATE POLICY "pixel_events_workspace_read" ON pixel_events FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pixel_events' AND policyname='pixel_events_service_role') THEN
      EXECUTE 'CREATE POLICY "pixel_events_service_role" ON pixel_events FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;

-- attribution_touchpoints
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='attribution_touchpoints') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='attribution_touchpoints' AND policyname='attribution_touchpoints_workspace_read') THEN
      EXECUTE 'CREATE POLICY "attribution_touchpoints_workspace_read" ON attribution_touchpoints FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='attribution_touchpoints' AND policyname='attribution_touchpoints_service_role') THEN
      EXECUTE 'CREATE POLICY "attribution_touchpoints_service_role" ON attribution_touchpoints FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;

-- attribution_conversions
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='attribution_conversions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='attribution_conversions' AND policyname='attribution_conversions_workspace_read') THEN
      EXECUTE 'CREATE POLICY "attribution_conversions_workspace_read" ON attribution_conversions FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='attribution_conversions' AND policyname='attribution_conversions_service_role') THEN
      EXECUTE 'CREATE POLICY "attribution_conversions_service_role" ON attribution_conversions FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;

-- daily_briefings
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='daily_briefings') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='daily_briefings' AND policyname='daily_briefings_workspace_read') THEN
      EXECUTE 'CREATE POLICY "daily_briefings_workspace_read" ON daily_briefings FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='daily_briefings' AND policyname='daily_briefings_service_role') THEN
      EXECUTE 'CREATE POLICY "daily_briefings_service_role" ON daily_briefings FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;

-- agent_actions
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='agent_actions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_actions' AND policyname='agent_actions_workspace_access') THEN
      EXECUTE 'CREATE POLICY "agent_actions_workspace_access" ON agent_actions FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_actions' AND policyname='agent_actions_service_role') THEN
      EXECUTE 'CREATE POLICY "agent_actions_service_role" ON agent_actions FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;

-- shared_dashboards
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='shared_dashboards') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='shared_dashboards' AND policyname='shared_dashboards_workspace_access') THEN
      EXECUTE 'CREATE POLICY "shared_dashboards_workspace_access" ON shared_dashboards FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='shared_dashboards' AND policyname='shared_dashboards_service_role') THEN
      EXECUTE 'CREATE POLICY "shared_dashboards_service_role" ON shared_dashboards FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;

-- beta_invites
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beta_invites')
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='beta_invites' AND policyname='beta_invites_service_only') THEN
    EXECUTE 'CREATE POLICY "beta_invites_service_only" ON beta_invites FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;

-- beta_redemptions
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beta_redemptions')
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='beta_redemptions' AND policyname='beta_redemptions_service_only') THEN
    EXECUTE 'CREATE POLICY "beta_redemptions_service_only" ON beta_redemptions FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;

-- waitlist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='waitlist') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='waitlist' AND policyname='waitlist_anon_insert') THEN
      EXECUTE 'CREATE POLICY "waitlist_anon_insert" ON waitlist FOR INSERT WITH CHECK (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='waitlist' AND policyname='waitlist_service_read') THEN
      EXECUTE 'CREATE POLICY "waitlist_service_read" ON waitlist FOR SELECT USING (auth.role() = ''service_role'')';
    END IF;
  END IF;
END $$;


-- ============================================================================
-- H4+H10: PLAN COLUMN PROTECTION
-- ============================================================================

DROP POLICY IF EXISTS "workspace_owner" ON workspaces;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='workspaces' AND policyname='workspace_owner_select') THEN
    CREATE POLICY "workspace_owner_select" ON workspaces FOR SELECT USING (owner_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='workspaces' AND policyname='workspace_owner_insert') THEN
    CREATE POLICY "workspace_owner_insert" ON workspaces FOR INSERT WITH CHECK (owner_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='workspaces' AND policyname='workspace_owner_update') THEN
    CREATE POLICY "workspace_owner_update" ON workspaces FOR UPDATE USING (owner_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='workspaces' AND policyname='workspace_owner_delete') THEN
    CREATE POLICY "workspace_owner_delete" ON workspaces FOR DELETE USING (owner_id = auth.uid());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION trg_protect_plan_column() RETURNS trigger AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN RETURN NEW; END IF;
  IF OLD.plan IS DISTINCT FROM NEW.plan THEN
    RAISE EXCEPTION 'plan_column_protected: only service_role can change the plan column' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_plan_column ON workspaces;
CREATE TRIGGER protect_plan_column BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION trg_protect_plan_column();


-- ============================================================================
-- C3: SECURITY DEFINER RPCs — add workspace membership authz
-- ============================================================================

CREATE OR REPLACE FUNCTION rpc_gsc_overview(p_workspace_id UUID, p_date_from DATE, p_date_to DATE)
RETURNS TABLE(total_clicks BIGINT, total_impressions BIGINT, avg_ctr NUMERIC, avg_position NUMERIC, total_keywords BIGINT) AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    IF NOT EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = p_workspace_id AND user_id = auth.uid())
       AND NOT EXISTS (SELECT 1 FROM workspaces WHERE id = p_workspace_id AND owner_id = auth.uid()) THEN
      RAISE EXCEPTION 'access_denied' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN QUERY SELECT
    COALESCE(SUM(clicks),0)::BIGINT, COALESCE(SUM(impressions),0)::BIGINT,
    CASE WHEN SUM(impressions)>0 THEN ROUND((SUM(clicks)::NUMERIC/SUM(impressions))*100,2) ELSE 0 END,
    ROUND(AVG(position)::NUMERIC,1), COUNT(DISTINCT query)::BIGINT
  FROM gsc_data WHERE workspace_id=p_workspace_id AND date>=p_date_from AND date<=p_date_to;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_ga4_overview(p_workspace_id UUID, p_date_from DATE, p_date_to DATE)
RETURNS TABLE(total_sessions BIGINT, total_users BIGINT, top_sources JSONB) AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    IF NOT EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = p_workspace_id AND user_id = auth.uid())
       AND NOT EXISTS (SELECT 1 FROM workspaces WHERE id = p_workspace_id AND owner_id = auth.uid()) THEN
      RAISE EXCEPTION 'access_denied' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN QUERY SELECT
    COALESCE(SUM(CASE WHEN metric_type='sessions' THEN value ELSE 0 END),0)::BIGINT,
    COALESCE(SUM(CASE WHEN metric_type='totalUsers' THEN value ELSE 0 END),0)::BIGINT,
    (SELECT jsonb_agg(row_to_json(s)) FROM (
      SELECT dimension_value AS source, SUM(value)::BIGINT AS sessions FROM ga4_data
      WHERE workspace_id=p_workspace_id AND date>=p_date_from AND date<=p_date_to
        AND metric_type='sessions' AND dimension_name='sessionSource'
      GROUP BY dimension_value ORDER BY SUM(value) DESC LIMIT 10
    ) s)
  FROM ga4_data WHERE workspace_id=p_workspace_id AND date>=p_date_from AND date<=p_date_to;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- M3: INTEGRATION TRIGGER — INSERT → INSERT OR UPDATE
-- ============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='integrations') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS integrations_plan_limit ON integrations';
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_integrations_limit') THEN
      EXECUTE 'CREATE TRIGGER integrations_plan_limit BEFORE INSERT OR UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION trg_integrations_limit()';
    END IF;
  END IF;
END $$;


COMMIT;
