-- Adds a JSONB column to store the full Claude creative breakdown
-- (hook details, scene-by-scene structure, why_it_works, replicable_formula,
-- emotional_triggers, target_audience). The flat ai_* columns remain for
-- fast filtering/sorting; this holds the rich payload the dashboard renders.

alter table public.competitor_ads
  add column if not exists ai_analysis jsonb;

comment on column public.competitor_ads.ai_analysis is
  'Full Claude vision analysis of the ad creative (hook, structure timeline, why_it_works, replicable_formula). Written by tools/analyze_ad_video.mjs.';
