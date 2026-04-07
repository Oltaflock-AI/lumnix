-- Teams migration: add invite columns to workspace_members
-- Run this against your Supabase database

-- Add invite-related columns to workspace_members
ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected'));

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_workspace_members_invite_token ON workspace_members(invite_token) WHERE invite_token IS NOT NULL;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_workspace_members_status ON workspace_members(status);

-- Set existing members to active
UPDATE workspace_members SET status = 'active' WHERE status IS NULL;
