-- Run this in Supabase SQL Editor for project: spzlhlurwwazuxgwwpqu (Lumnix)

CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT,
  role TEXT,
  team_size TEXT,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (anon key used on landing page API)
CREATE POLICY "Service role full access on waitlist" ON public.waitlist
  FOR ALL USING (true) WITH CHECK (true);

-- Index for fast duplicate checks
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist (email);
