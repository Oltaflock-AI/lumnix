import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

import { callClaude } from '@/lib/anthropic';

async function callOpenAI(messages: any[], maxTokens: number) {
  return callClaude(
    messages.filter((m: any) => m.role !== 'system').map((m: any) => ({ role: m.role, content: m.content })),
    { maxTokens, system: messages.find((m: any) => m.role === 'system')?.content }
  );
}

function parseJSON(text: string) {
  try { return JSON.parse(text); } catch {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { competitor_id } = await req.json();
  if (!competitor_id) return NextResponse.json({ error: 'competitor_id required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Resolve the competitor's workspace and verify membership. Without this
  // any authed user could trigger paid Claude analysis against any
  // competitor_id — cost-abuse + data exfil.
  const { data: guardCompetitor } = await supabase
    .from('competitor_brands')
    .select('id, workspace_id')
    .eq('id', competitor_id)
    .single();
  if (!guardCompetitor) {
    return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
  }
  const access = await verifyWorkspaceAccess(req, guardCompetitor.workspace_id);
  if (access instanceof NextResponse) return access;

  // Check for fresh cached analysis (< 24hrs)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from('ai_analysis')
    .select('*')
    .eq('competitor_id', competitor_id)
    .gte('created_at', oneDayAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (cached) {
    const { data: ideas } = await supabase.from('ad_ideas').select('*').eq('competitor_id', competitor_id).order('created_at', { ascending: false });
    return NextResponse.json({ analysis: cached, ideas: ideas ?? [], cached: true });
  }

  // Get top 80 ads
  const { data: ads } = await supabase
    .from('competitor_ads')
    .select('*')
    .eq('competitor_id', competitor_id)
    .order('is_active', { ascending: false })
    .order('impressions_upper', { ascending: false })
    .limit(80);

  if (!ads || ads.length === 0) {
    return NextResponse.json({ error: 'No ads found. Run scrape first.' }, { status: 400 });
  }

  const { data: competitor } = await supabase.from('competitor_brands').select('name').eq('id', competitor_id).single();
  const competitorName = competitor?.name ?? 'Unknown';

  // Build compact ad summary
  const adSummary = ads.map((ad: any, i: number) =>
    `[${i + 1}][${ad.is_active ? 'ACTIVE' : 'PAUSED'}] Headline: "${ad.ad_creative_link_title ?? 'N/A'}" | Copy: "${(ad.ad_creative_body ?? 'N/A').slice(0, 120)}" | Impressions: ${ad.impressions_lower ?? 0}-${ad.impressions_upper ?? 0} | Platforms: ${(ad.platforms ?? []).join('/')}`
  ).join('\n');

  // Step 1: Pattern analysis
  const analysisText = await callOpenAI([
    { role: 'system', content: 'You are a performance marketing analyst. Return ONLY valid JSON, no markdown.' },
    { role: 'user', content: `Analyse these ${ads.length} ads from "${competitorName}". Return JSON:\n\n${adSummary}\n\n{"hook_patterns":[{"pattern":string,"count":number,"example":string}],"messaging_angles":[{"angle":string,"strength":"primary|secondary","description":string}],"offer_mechanics":[{"type":string,"frequency":number,"example":string}],"visual_style":string,"summary":string}` }
  ], 1500);

  let analysis: any;
  try { analysis = parseJSON(analysisText); } catch {
    return NextResponse.json({ error: 'AI analysis failed to parse' }, { status: 500 });
  }

  const { data: savedAnalysis, error: saveErr } = await supabase
    .from('ai_analysis')
    .insert({
      competitor_id,
      hook_patterns: analysis.hook_patterns ?? [],
      messaging_angles: analysis.messaging_angles ?? [],
      offer_mechanics: analysis.offer_mechanics ?? [],
      visual_style: analysis.visual_style ?? '',
      ads_analysed_count: ads.length,
      raw_output: JSON.stringify(analysis),
    })
    .select()
    .single();

  if (saveErr || !savedAnalysis) {
    return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
  }

  // Step 2: Generate ad ideas
  const ideasText = await callOpenAI([
    { role: 'system', content: 'You are a performance marketing strategist. Return ONLY a valid JSON array, no markdown.' },
    { role: 'user', content: `Based on competitor analysis for "${competitorName}":\nHook patterns: ${JSON.stringify(analysis.hook_patterns?.slice(0, 3))}\nMessaging angles: ${JSON.stringify(analysis.messaging_angles?.slice(0, 3))}\nOffer mechanics: ${JSON.stringify(analysis.offer_mechanics?.slice(0, 3))}\nVisual style: ${analysis.visual_style}\nSummary: ${analysis.summary}\n\nGenerate 10 counter-strategy ad ideas that beat these angles. Return JSON array:\n[{"hook":string,"body_copy":string,"cta":string,"visual_direction":string,"target_audience":string,"counter_angle":string}]` }
  ], 2000);

  let ideas: any[] = [];
  try { ideas = parseJSON(ideasText); } catch { ideas = []; }

  if (ideas.length > 0) {
    await supabase.from('ad_ideas').insert(ideas.map((idea: any) => ({
      competitor_id,
      analysis_id: savedAnalysis.id,
      hook: idea.hook,
      body_copy: idea.body_copy,
      cta: idea.cta,
      visual_direction: idea.visual_direction,
      target_audience: idea.target_audience,
      counter_angle: idea.counter_angle,
      status: 'idea',
    })));
  }

  return NextResponse.json({ analysis: savedAnalysis, ideas, ideasCount: ideas.length });
}
