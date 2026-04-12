-- Email onboarding sequence tracking table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  -- email_type values:
  -- 'welcome'           Day 0 — sent immediately on signup
  -- 'connect_sources'   Day 1 — connect your first integration
  -- 'first_insight'     Day 2 — your data is ready, here's what we found
  -- 'feature_spotlight' Day 5 — competitor ad spy + AI assistant spotlight
  -- 'checkin'           Day 7 — are you getting value? + tips

  status TEXT DEFAULT 'pending',
  -- 'pending' | 'sent' | 'failed' | 'skipped'

  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON email_sequences(user_id, email_type);
CREATE INDEX ON email_sequences(status, scheduled_for);

ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
-- Only service role can read/write this table — no user-facing RLS needed

-- Email preferences table for unsubscribe tracking
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  opted_out BOOLEAN DEFAULT false,
  opted_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON email_preferences(user_id);
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
