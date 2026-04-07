-- Chat usage tracking for plan limit enforcement
CREATE TABLE IF NOT EXISTS chat_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_usage_workspace_date ON chat_usage (workspace_id, created_at);

-- Auto-delete entries older than 7 days to keep the table small
-- Run via cron or scheduled cleanup
ALTER TABLE chat_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON chat_usage
  FOR ALL USING (auth.role() = 'service_role');
