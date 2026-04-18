-- Security tightening — 2026-04-18
-- Closes C1/C2/H4 from the 2026-04-18 audit:
--   * Drops every `USING (true)` permissive policy that leaked across tenants.
--   * Replaces them with explicit service-role-only policies.
--   * Adds oauth_nonces table for single-use OAuth state replay protection.
--
-- Safe to run multiple times. Idempotent drops/creates guarded.
-- Run AFTER security-rls-overhaul.sql. NEVER rerun RUN_THIS_NOW.sql after this.

-- ── Drop permissive USING(true) policies ────────────────────────────────────
DROP POLICY IF EXISTS "beta_invites_service" ON beta_invites;
DROP POLICY IF EXISTS "beta_redemptions_service" ON beta_redemptions;

DROP POLICY IF EXISTS "creative_boards_service" ON creative_boards;
DROP POLICY IF EXISTS "creative_saves_service" ON creative_saves;
DROP POLICY IF EXISTS "generated_creatives_service" ON generated_creatives;

DROP POLICY IF EXISTS "campaigns_managed_service" ON campaigns_managed;
DROP POLICY IF EXISTS "pixel_events_service" ON pixel_events;
DROP POLICY IF EXISTS "attribution_touchpoints_service" ON attribution_touchpoints;
DROP POLICY IF EXISTS "attribution_conversions_service" ON attribution_conversions;

DROP POLICY IF EXISTS "daily_briefings_service" ON daily_briefings;
DROP POLICY IF EXISTS "agent_actions_service" ON agent_actions;
DROP POLICY IF EXISTS "shared_dashboards_service" ON shared_dashboards;

-- Note: service role key bypasses RLS implicitly. Re-adding explicit
-- service-role policies only if a non-default role path needs them.
-- For now rely on the existing workspace-member access policies; service
-- access happens via the service_role JWT and bypasses RLS.

-- ── Ensure workspace-member access policies exist on the above tables ───────
-- (No-op if already created by security-rls-overhaul.sql; included for safety.)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creative_boards' AND policyname = 'creative_boards_access') THEN
    CREATE POLICY "creative_boards_access" ON creative_boards FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))
      WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creative_saves' AND policyname = 'creative_saves_access') THEN
    CREATE POLICY "creative_saves_access" ON creative_saves FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))
      WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'generated_creatives' AND policyname = 'generated_creatives_access') THEN
    CREATE POLICY "generated_creatives_access" ON generated_creatives FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))
      WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaigns_managed' AND policyname = 'campaigns_managed_access') THEN
    CREATE POLICY "campaigns_managed_access" ON campaigns_managed FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))
      WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pixel_events' AND policyname = 'pixel_events_access') THEN
    CREATE POLICY "pixel_events_access" ON pixel_events FOR SELECT
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attribution_touchpoints' AND policyname = 'attribution_touchpoints_access') THEN
    CREATE POLICY "attribution_touchpoints_access" ON attribution_touchpoints FOR SELECT
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attribution_conversions' AND policyname = 'attribution_conversions_access') THEN
    CREATE POLICY "attribution_conversions_access" ON attribution_conversions FOR SELECT
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_briefings' AND policyname = 'daily_briefings_access') THEN
    CREATE POLICY "daily_briefings_access" ON daily_briefings FOR SELECT
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_actions' AND policyname = 'agent_actions_access') THEN
    CREATE POLICY "agent_actions_access" ON agent_actions FOR SELECT
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;

  -- shared_dashboards: readable only by owning workspace members; the share_token
  -- lookup runs via service role from /api/share/[token], bypassing RLS.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shared_dashboards' AND policyname = 'shared_dashboards_access') THEN
    CREATE POLICY "shared_dashboards_access" ON shared_dashboards FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))
      WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- beta_invites / beta_redemptions: admin-only tables. No authenticated access —
-- all reads/writes go through service-role routes (/api/beta/validate etc.).
-- Leaving RLS enabled with NO policies means no role except service_role can
-- read them. service_role bypasses RLS. That's the desired posture.

-- ── oauth_nonces: single-use replay protection ──────────────────────────────
CREATE TABLE IF NOT EXISTS oauth_nonces (
  nonce TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_nonces_expires ON oauth_nonces(expires_at);

ALTER TABLE oauth_nonces ENABLE ROW LEVEL SECURITY;
-- no policies: service-role only

-- Optional cleanup helper (call from cron, or add pg_cron)
CREATE OR REPLACE FUNCTION prune_expired_oauth_nonces()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM oauth_nonces WHERE expires_at < NOW();
$$;

-- ── Share token entropy assertion ───────────────────────────────────────────
-- shared_dashboards.share_token must be >= 32 chars of base64url/hex entropy.
-- Adds a CHECK constraint; drop and re-add if your existing tokens are shorter.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'shared_dashboards_share_token_entropy'
  ) THEN
    -- Guard against rows that would violate the new constraint
    IF NOT EXISTS (SELECT 1 FROM shared_dashboards WHERE length(share_token) < 32) THEN
      ALTER TABLE shared_dashboards
        ADD CONSTRAINT shared_dashboards_share_token_entropy
        CHECK (length(share_token) >= 32);
    END IF;
  END IF;
END $$;

-- ── Audit: list any remaining USING(true) policies (for verification) ───────
-- Run manually after migration:
--   SELECT schemaname, tablename, policyname, qual
--   FROM pg_policies
--   WHERE qual::text = 'true' OR (with_check IS NOT NULL AND with_check::text = 'true');
-- Expected result: 0 rows.
