-- Plan-limit enforcement triggers
--
-- Reason: the Node.js checkPlanLimit helper does SELECT count THEN INSERT as
-- two separate calls. Parallel requests from a single workspace can race past
-- the cap (e.g. POST /api/competitors/add × 10 in one tick → 10 rows on a
-- 2-row plan). Push the cap enforcement into the database so inserts fail
-- atomically.
--
-- Safe to re-run: uses CREATE OR REPLACE and DROP TRIGGER IF EXISTS.

CREATE OR REPLACE FUNCTION enforce_plan_limit(
  p_workspace_id uuid,
  p_resource text,
  p_current_count integer
) RETURNS void AS $$
DECLARE
  v_plan text;
  v_limit integer;
BEGIN
  SELECT plan INTO v_plan FROM workspaces WHERE id = p_workspace_id;
  IF v_plan IS NULL THEN v_plan := 'free'; END IF;

  -- limits must mirror src/lib/plan-limits.ts
  v_limit := CASE p_resource
    WHEN 'competitors' THEN
      CASE v_plan
        WHEN 'free' THEN 2
        WHEN 'starter' THEN 5
        WHEN 'growth' THEN 15
        WHEN 'pro' THEN 10
        WHEN 'agency' THEN NULL
        WHEN 'enterprise' THEN NULL
        ELSE 2
      END
    WHEN 'teamMembers' THEN
      CASE v_plan
        WHEN 'free' THEN 2
        WHEN 'starter' THEN 5
        WHEN 'growth' THEN 15
        WHEN 'pro' THEN 10
        WHEN 'agency' THEN NULL
        WHEN 'enterprise' THEN NULL
        ELSE 2
      END
    WHEN 'integrations' THEN
      CASE v_plan
        WHEN 'free' THEN 2
        WHEN 'starter' THEN 4
        WHEN 'pro' THEN 4
        ELSE NULL -- growth/agency/enterprise unlimited
      END
    ELSE NULL
  END;

  IF v_limit IS NOT NULL AND p_current_count >= v_limit THEN
    RAISE EXCEPTION USING
      MESSAGE = format('plan_limit_exceeded:%s:%s', p_resource, v_limit),
      ERRCODE = 'P0001';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_competitor_brands_limit() RETURNS trigger AS $$
DECLARE v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM competitor_brands WHERE workspace_id = NEW.workspace_id;
  PERFORM enforce_plan_limit(NEW.workspace_id, 'competitors', v_count);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS competitor_brands_plan_limit ON competitor_brands;
CREATE TRIGGER competitor_brands_plan_limit
  BEFORE INSERT ON competitor_brands
  FOR EACH ROW EXECUTE FUNCTION trg_competitor_brands_limit();

CREATE OR REPLACE FUNCTION trg_workspace_members_limit() RETURNS trigger AS $$
DECLARE v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM workspace_members WHERE workspace_id = NEW.workspace_id;
  PERFORM enforce_plan_limit(NEW.workspace_id, 'teamMembers', v_count);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workspace_members_plan_limit ON workspace_members;
CREATE TRIGGER workspace_members_plan_limit
  BEFORE INSERT ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION trg_workspace_members_limit();

CREATE OR REPLACE FUNCTION trg_integrations_limit() RETURNS trigger AS $$
DECLARE v_count integer;
BEGIN
  IF NEW.status IS DISTINCT FROM 'connected' THEN RETURN NEW; END IF;
  SELECT count(*) INTO v_count FROM integrations
    WHERE workspace_id = NEW.workspace_id AND status = 'connected';
  PERFORM enforce_plan_limit(NEW.workspace_id, 'integrations', v_count);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS integrations_plan_limit ON integrations;
CREATE TRIGGER integrations_plan_limit
  BEFORE INSERT ON integrations
  FOR EACH ROW EXECUTE FUNCTION trg_integrations_limit();
