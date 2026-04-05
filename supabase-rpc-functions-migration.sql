-- RPC functions for efficient data aggregation (replacing JS aggregation)

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

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_gsc_data_workspace_date ON gsc_data(workspace_id, date);
CREATE INDEX IF NOT EXISTS idx_gsc_data_workspace_clicks ON gsc_data(workspace_id, clicks DESC);
CREATE INDEX IF NOT EXISTS idx_ga4_data_workspace_date ON ga4_data(workspace_id, date);
CREATE INDEX IF NOT EXISTS idx_ga4_data_workspace_metric ON ga4_data(workspace_id, metric_type, date);
CREATE INDEX IF NOT EXISTS idx_analytics_data_workspace_provider ON analytics_data(workspace_id, provider, date_range_start);
CREATE INDEX IF NOT EXISTS idx_anomalies_workspace_date ON anomalies(workspace_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_integrations_workspace_status ON integrations(workspace_id, status);
