import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  const { competitor_id, workspace_id } = await req.json();
  if (!competitor_id || !workspace_id) {
    return NextResponse.json({ error: 'competitor_id and workspace_id required' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();

  // Get competitor info
  const { data: competitor } = await supabase
    .from('competitor_brands')
    .select('name, facebook_page_name_resolved')
    .eq('id', competitor_id)
    .single();

  if (!competitor) {
    return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
  }

  // Fetch winning + top_performer ads
  const { data: winningAds, error: adsErr } = await supabase
    .from('competitor_ads')
    .select('*')
    .eq('competitor_id', competitor_id)
    .eq('workspace_id', workspace_id)
    .in('performance_tier', ['winning', 'top_performer'])
    .order('days_running', { ascending: false })
    .limit(30);

  if (adsErr || !winningAds || winningAds.length === 0) {
    return NextResponse.json({ error: 'No winning ads to analyze' }, { status: 400 });
  }

  // Build prompt payload
  const adsPayload = winningAds.map((ad: any, i: number) => `
Ad #${i + 1} (Running ${ad.days_running} days — ${ad.performance_tier === 'top_performer' ? 'TOP PERFORMER' : 'WINNING'})
Format: ${ad.ad_format || 'unknown'}
Headline: ${ad.headline || 'none'}
Body Copy: ${ad.ad_copy || 'none'}
CTA: ${ad.call_to_action || 'none'}
`).join('\n---\n');

  const brandName = competitor.facebook_page_name_resolved || competitor.name;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `You are a senior creative strategist analyzing competitor ads to find winning patterns.

Here are ${winningAds.length} ads from ${brandName} that have been running for 90+ days on Meta — meaning they are proven performers.

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
      return NextResponse.json({ error: 'AI analysis failed — try regenerating' }, { status: 502 });
    }

    const result = await response.json();
    const briefText = result.content?.[0]?.text || '';

    // Parse sections from the brief
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

    // Parse content angles into JSON
    const anglesSection = parseSection(briefText, 'CONTENT ANGLES');
    const angleBlocks = anglesSection.split(/(?=\d+\.\s)/).filter(b => b.trim());
    const contentAngles = angleBlocks.map(block => {
      const lines = block.split('\n').filter(l => l.trim());
      return {
        name: lines[0]?.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim() || '',
        details: lines.slice(1).join('\n').trim(),
      };
    });

    // Upsert brief
    // Check if brief already exists for this competitor
    const { data: existingBrief } = await supabase
      .from('competitor_briefs')
      .select('id')
      .eq('competitor_id', competitor_id)
      .eq('workspace_id', workspace_id)
      .single();

    if (existingBrief) {
      await supabase.from('competitor_briefs').update({
        hook_patterns: hookPatterns,
        pain_points: painPoints,
        offer_structures: offerStructures,
        visual_themes: visualThemes,
        content_angles: contentAngles,
        raw_brief: briefText,
        ads_analyzed: winningAds.length,
        generated_at: new Date().toISOString(),
      }).eq('id', existingBrief.id);
    } else {
      await supabase.from('competitor_briefs').insert({
        workspace_id,
        competitor_id,
        hook_patterns: hookPatterns,
        pain_points: painPoints,
        offer_structures: offerStructures,
        visual_themes: visualThemes,
        content_angles: contentAngles,
        raw_brief: briefText,
        ads_analyzed: winningAds.length,
        generated_at: new Date().toISOString(),
      });
    }

    // Mark ads as analyzed
    const adIds = winningAds.map((a: any) => a.id);
    await supabase
      .from('competitor_ads')
      .update({ ai_analyzed: true })
      .in('id', adIds);

    return NextResponse.json({ success: true, ads_analyzed: winningAds.length });
  } catch (err: any) {
    console.error('AI analysis error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
