-- Creative Studio tables for Week 2

-- Creative boards (organize saved ads)
CREATE TABLE IF NOT EXISTS creative_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#7C3AED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved ads / creatives to boards
CREATE TABLE IF NOT EXISTS creative_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES creative_boards(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'meta_ad_library', 'manual_upload', 'generated'
  source_id TEXT,            -- external ID (e.g. Meta Ad Library ad ID)
  title TEXT,
  image_url TEXT,
  video_url TEXT,
  landing_page_url TEXT,
  ad_copy TEXT,
  cta TEXT,
  advertiser_name TEXT,
  platform TEXT,             -- 'facebook', 'instagram', 'google', etc.
  started_running DATE,      -- when the ad started (longevity tracking)
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',  -- AI-generated tags: hook type, format, style, etc.
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-generated creatives (ad copy, video scripts, briefs)
CREATE TABLE IF NOT EXISTS generated_creatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL,        -- 'ad_copy', 'video_script', 'creative_brief', 'image_concept'
  framework TEXT,            -- 'AIDA', 'PAS', 'hook_body_cta', 'BAB', etc.
  prompt TEXT,               -- what the user asked for
  output JSONB NOT NULL,     -- generated content (array of variations)
  brand_context TEXT,        -- brand info used for generation
  target_audience TEXT,
  data_context JSONB,        -- workspace data used (top keywords, best ads, etc.)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creative_boards_workspace ON creative_boards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_creative_saves_workspace ON creative_saves(workspace_id);
CREATE INDEX IF NOT EXISTS idx_creative_saves_board ON creative_saves(board_id);
CREATE INDEX IF NOT EXISTS idx_creative_saves_tags ON creative_saves USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_creative_saves_source ON creative_saves(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_generated_creatives_workspace ON generated_creatives(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_creatives_type ON generated_creatives(workspace_id, type);

-- RLS
ALTER TABLE creative_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_creatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creative_boards_access" ON creative_boards FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "creative_boards_service" ON creative_boards FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "creative_saves_access" ON creative_saves FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "creative_saves_service" ON creative_saves FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "generated_creatives_access" ON generated_creatives FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "generated_creatives_service" ON generated_creatives FOR ALL
  USING (true) WITH CHECK (true);
