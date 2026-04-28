import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { callClaude } from '@/lib/anthropic';
import { rateLimit } from '@/lib/rate-limit';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

// POST /api/ad-ideas/generate
// Body: { workspace_id, competitor_id?, platform: 'google_ads' | 'meta_ads', context?: string }
export async function POST(req: NextRequest) {
  const { workspace_id, competitor_id, platform, context } = await req.json();

  if (!workspace_id || !platform) {
    return NextResponse.json({ error: 'workspace_id and platform required' }, { status: 400 });
  }

  const auth = await verifyWorkspaceAccess(req, workspace_id);
  if (auth instanceof NextResponse) return auth;

  const rateLimited = rateLimit(`adgen:${workspace_id}`, 5, 60 * 1000);
  if (rateLimited) return rateLimited;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
  }

  const db = getSupabaseAdmin();

  // Gather context: workspace keywords, competitor info, existing ads
  const [gscRes, competitorRes, gapRes] = await Promise.allSettled([
    db.from('gsc_data').select('query, clicks, impressions').eq('workspace_id', workspace_id).order('clicks', { ascending: false }).limit(30),
    competitor_id ? db.from('competitors').select('name, domain').eq('id', competitor_id).eq('workspace_id', workspace_id).single() : Promise.resolve({ data: null }),
    competitor_id ? db.from('keyword_gaps').select('keyword, recommended_action').eq('competitor_id', competitor_id).eq('workspace_id', workspace_id).limit(10) : Promise.resolve({ data: [] }),
  ]);

  const topKeywords = (gscRes.status === 'fulfilled' ? gscRes.value.data || [] : []).map((r: any) => r.query).slice(0, 15);
  const competitor = competitorRes.status === 'fulfilled' ? (competitorRes.value as any).data : null;
  const gaps = gapRes.status === 'fulfilled' ? ((gapRes.value as any).data || []) : [];

  const platformSpec = platform === 'google_ads'
    ? 'Google Ads format: 3 headlines (max 30 chars each), 2 descriptions (max 90 chars each), display URL'
    : 'Meta Ads format: primary text (125 chars), headline (40 chars), description (30 chars), call-to-action button suggestion';

  const systemPrompt = `You are an expert ad copywriter. Generate 5 creative, high-converting ad variations.

Format: ${platformSpec}

For each ad, provide:
- All required text fields for the platform
- A "hook" explaining the psychological trigger used (scarcity, social proof, curiosity, etc.)
- A "target_audience" description

Return a JSON object with an "ads" key. Only output JSON, no other text.`;

  const userPrompt = `Generate ad copy for ${platform === 'google_ads' ? 'Google Ads' : 'Meta Ads'}.

Top performing keywords: ${topKeywords.join(', ')}
${competitor ? `Competitor: ${competitor.name} (${competitor.domain})` : ''}
${gaps.length > 0 ? `Keyword gaps to target: ${gaps.map((g: any) => g.keyword).join(', ')}` : ''}
${context ? `Additional context: ${context}` : ''}`;

  const aiText = await callClaude([{ role: 'user', content: userPrompt }], { maxTokens: 2000, system: systemPrompt });

  let ads: any[] = [];
  try {
    const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiText];
    const parsed = JSON.parse(jsonMatch[1]!.trim());
    ads = parsed.ads || parsed.ideas || [];
  } catch {
    return NextResponse.json({ error: 'Failed to generate ads' }, { status: 500 });
  }

  // Store in ad_ideas table
  if (ads.length > 0) {
    const inserts = ads.map((ad: any) => ({
      workspace_id,
      competitor_id: competitor_id || null,
      platform,
      content: ad,
      status: 'idea',
      created_at: new Date().toISOString(),
    }));

    try { await db.from('ad_ideas').insert(inserts); } catch {}
  }

  return NextResponse.json({ ads, count: ads.length });
}
