-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- seo, traffic, ads, competitor
  priority TEXT NOT NULL DEFAULT 'medium', -- high, medium, low
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_url TEXT, -- deep link to relevant dashboard page
  is_dismissed BOOLEAN DEFAULT false,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_workspace ON recommendations(workspace_id);
CREATE INDEX idx_recommendations_active ON recommendations(workspace_id, is_dismissed) WHERE is_dismissed = false;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  metric TEXT NOT NULL, -- sessions, clicks, impressions, conversions
  forecast_data JSONB NOT NULL DEFAULT '[]', -- array of { date, predicted, lower, upper }
  narrative TEXT, -- AI-generated interpretation
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_workspace ON predictions(workspace_id);
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
