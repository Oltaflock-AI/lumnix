import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { CLAUDE_MODEL_SMART } from '@/lib/models';

// Shared competitor creative-brief generator.
//
// Extracted from /api/competitors/analyze so server-side callers (the scrape
// route's after() hook, the spy-agent cron) can invoke it DIRECTLY instead of
// fetch()-ing the API route — those internal HTTP calls carried no user
// Authorization header, so middleware rejected them with 401 and the brief
// silently never generated.

export interface BriefResult {
  ok: boolean;
  adsAnalyzed?: number;
  error?: string;
  status?: number;
}

export async function generateCompetitorBrief(
  competitorId: string,
  workspaceId: string
): Promise<BriefResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: 'ANTHROPIC_API_KEY not configured', status: 500 };

  const supabase = getSupabaseAdmin();

  // Scope the competitor lookup to the workspace. Callers must have already
  // authorized workspaceId (middleware for API callers, cron secret for jobs);
  // the pairing check prevents cross-workspace competitor_id reuse.
  const { data: competitor } = await supabase
    .from('competitor_brands')
    .select('name, facebook_page_name_resolved')
    .eq('id', competitorId)
    .eq('workspace_id', workspaceId)
    .single();

  if (!competitor) return { ok: false, error: 'Competitor not found', status: 404 };

  // Prefer winning + top_performer ads (≥90d). Fall back to top 30 by longevity
  // so brand-new competitors with only short-lived ads still get a brief.
  const { data: winners } = await supabase
    .from('competitor_ads')
    .select('*')
    .eq('competitor_id', competitorId)
    .eq('workspace_id', workspaceId)
    .in('performance_tier', ['winning', 'top_performer'])
    .order('days_running', { ascending: false })
    .limit(30);

  let adsToAnalyze = winners ?? [];
  let usingFallback = false;

  if (adsToAnalyze.length === 0) {
    const { data: fallback } = await supabase
      .from('competitor_ads')
      .select('*')
      .eq('competitor_id', competitorId)
      .eq('workspace_id', workspaceId)
      .order('days_running', { ascending: false })
      .limit(30);
    adsToAnalyze = fallback ?? [];
    usingFallback = true;
  }

  if (adsToAnalyze.length === 0) return { ok: false, error: 'No ads to analyze', status: 400 };

  const winningAds = adsToAnalyze;

  const tierLabel = (tier: string) => {
    if (tier === 'top_performer') return 'TOP PERFORMER';
    if (tier === 'winning') return 'WINNING';
    return 'ACTIVE';
  };

  const adsPayload = winningAds.map((ad: any, i: number) => `
Ad #${i + 1} (Running ${ad.days_running} days — ${tierLabel(ad.performance_tier)})
Format: ${ad.ad_format || 'unknown'}
Headline: ${ad.headline || 'none'}
Body Copy: ${ad.ad_copy || 'none'}
CTA: ${ad.call_to_action || 'none'}
`).join('\n---\n');

  const brandName = competitor.facebook_page_name_resolved || competitor.name;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL_SMART,
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are a senior creative strategist analyzing competitor ads to find winning patterns.

${usingFallback
  ? `Here are ${winningAds.length} of ${brandName}'s current Meta ads, ordered by longevity. None have hit the 90-day "proven performer" threshold yet, so treat this as an early read on their creative strategy rather than a pattern of proven winners.`
  : `Here are ${winningAds.length} ads from ${brandName} that have been running for 90+ days on Meta — meaning they are proven performers.`}

${adsPayload}

Analyze these ads and provide:

1. HOOK PATTERNS: What hooks do they use repeatedly? (fear, curiosity, social proof, direct benefit, etc.)
2. PAIN POINTS: What customer pain points do they target most?
3. OFFER STRUCTURE: How do they frame their offer? (discount, urgency, guarantee, free trial, etc.)
4. VISUAL THEMES: What visual/creative patterns appear across their best ads?
5. MESSAGING TONE: How do they speak to their audience?

Then provide EXACTLY 5 CONTENT ANGLES we should create to compete with or complement these patterns. For each angle include:
- Angle name (3-5 words)
- Hook line (the first line of the ad)
- Core message (1-2 sentences)
- Suggested format (video/image/carousel)
- Why this will work given what you saw

Be specific and actionable. Reference actual patterns from the ads above.

IMPORTANT: Structure your response with these exact section headers:
## HOOK PATTERNS
## PAIN POINTS
## OFFER STRUCTURE
## VISUAL THEMES
## MESSAGING TONE
## CONTENT ANGLES
(number each angle 1-5)`
      }],
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    console.error('Claude API error:', errData);
    return { ok: false, error: 'AI analysis failed — try regenerating', status: 502 };
  }

  const result = await response.json();
  const briefText = result.content?.[0]?.text || '';

  const parseSection = (text: string, header: string, nextHeader?: string): string => {
    const pattern = new RegExp(`##\\s*${header}[\\s\\S]*?(?=##\\s*${nextHeader || '$'}|$)`, 'i');
    const match = text.match(pattern);
    if (!match) return '';
    return match[0].replace(new RegExp(`##\\s*${header}`, 'i'), '').trim();
  };

  const hookPatterns = parseSection(briefText, 'HOOK PATTERNS', 'PAIN POINTS');
  const painPoints = parseSection(briefText, 'PAIN POINTS', 'OFFER STRUCTURE');
  const offerStructures = parseSection(briefText, 'OFFER STRUCTURE', 'VISUAL THEMES');
  const visualThemes = parseSection(briefText, 'VISUAL THEMES', 'MESSAGING TONE');

  const anglesSection = parseSection(briefText, 'CONTENT ANGLES');
  const angleBlocks = anglesSection.split(/(?=\d+\.\s)/).filter(b => /^\d+\.\s/.test(b.trim()));
  const contentAngles = angleBlocks.map(block => {
    const lines = block.split('\n').filter(l => l.trim());
    return {
      name: lines[0]?.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim() || '',
      details: lines.slice(1).join('\n').trim(),
    };
  });

  const { data: existingBrief } = await supabase
    .from('competitor_briefs')
    .select('id')
    .eq('competitor_id', competitorId)
    .eq('workspace_id', workspaceId)
    .single();

  const briefRow = {
    hook_patterns: hookPatterns,
    pain_points: painPoints,
    offer_structures: offerStructures,
    visual_themes: visualThemes,
    content_angles: contentAngles,
    raw_brief: briefText,
    ads_analyzed: winningAds.length,
    generated_at: new Date().toISOString(),
  };

  if (existingBrief) {
    await supabase.from('competitor_briefs').update(briefRow).eq('id', existingBrief.id);
  } else {
    await supabase.from('competitor_briefs').insert({
      workspace_id: workspaceId,
      competitor_id: competitorId,
      ...briefRow,
    });
  }

  const adIds = winningAds.map((a: any) => a.id);
  await supabase.from('competitor_ads').update({ ai_analyzed: true }).in('id', adIds);

  return { ok: true, adsAnalyzed: winningAds.length };
}
