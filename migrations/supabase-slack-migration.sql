-- Add Slack webhook URL to workspaces
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS slack_webhook_url TEXT;
