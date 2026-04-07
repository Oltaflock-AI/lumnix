import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const FRAMEWORKS: Record<string, string> = {
  AIDA: 'Attention → Interest → Desire → Action. Start with a bold hook, build curiosity, create desire with benefits, end with clear CTA.',
  PAS: 'Problem → Agitate → Solution. Name the pain, twist the knife on consequences, present your product as the fix.',
  hook_body_cta: 'Hook (pattern interrupt, first 3 seconds) → Body (value prop, social proof, benefits) → CTA (clear next step).',
  BAB: 'Before → After → Bridge. Show the painful "before", paint the dream "after", position your product as the bridge.',
  '4Ps': 'Promise → Picture → Proof → Push. Make a bold promise, help them visualize the result, show proof, push to act.',
};

// POST /api/creative/generate
export async function POST(req: NextRequest) {
  try {
    const { workspace_id, type, framework, brand_context, target_audience, additional_context, tone } = await req.json();

    if (!workspace_id || !type) {
      return NextResponse.json({ error: 'workspace_id and type required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });

    const db = getSupabaseAdmin();

    // Pull workspace data for context
    const [wsRes, gscRes, ga4Res] = await Promise.all([
      db.from('workspaces').select('name, brand_color').eq('id', workspace_id).single(),
      db.from('gsc_data').select('query, clicks, impressions, position')
        .eq('workspace_id', workspace_id)
        .order('clicks', { ascending: false }).limit(10),
      db.from('ga4_data').select('dimension_name, dimension_value, value')
        .eq('workspace_id', workspace_id)
        .eq('dimension_name', 'pagePath')
        .order('value', { ascending: false }).limit(5),
    ]);

    const brandName = wsRes.data?.name || 'the brand';
    const topKeywords = (gscRes.data || []).map(r => r.query).filter(Boolean).slice(0, 5);
    const topPages = (ga4Res.data || []).map(r => r.dimension_value).filter(Boolean).slice(0, 3);

    const dataContext = {
      topKeywords,
      topPages,
      brandName,
    };

    const frameworkGuide = framework && FRAMEWORKS[framework]
      ? `\n\nFRAMEWORK TO USE: ${framework}\n${FRAMEWORKS[framework]}`
      : '';

    const prompts: Record<string, string> = {
      ad_copy: `Generate 5 ad copy variations for ${brandName}.
${brand_context ? `Brand context: ${brand_context}` : ''}
${target_audience ? `Target audience: ${target_audience}` : ''}
${topKeywords.length > 0 ? `Top performing keywords: ${topKeywords.join(', ')}` : ''}
${tone ? `Tone: ${tone}` : 'Tone: conversational, confident'}
${additional_context ? `Additional context: ${additional_context}` : ''}
${frameworkGuide}

For each variation, output:
- headline (max 40 chars)
- primary_text (the main ad copy, 2-4 sentences)
- cta (call to action text)
- hook_type (e.g. "question", "statistic", "bold claim", "story", "social proof")

Return as a JSON array of objects with these fields. Only output the JSON array, no other text.`,

      video_script: `Write 3 short-form video ad scripts (30-60 seconds each) for ${brandName}.
${brand_context ? `Brand context: ${brand_context}` : ''}
${target_audience ? `Target audience: ${target_audience}` : ''}
${topKeywords.length > 0 ? `Top performing keywords: ${topKeywords.join(', ')}` : ''}
${tone ? `Tone: ${tone}` : 'Tone: energetic, authentic'}
${additional_context ? `Additional context: ${additional_context}` : ''}
${frameworkGuide}

For each script, output:
- title (descriptive name for this script concept)
- hook (first 3 seconds — the attention grabber)
- body (main content, written as speaker directions + dialogue, 4-6 beats)
- cta (closing call to action with visual direction)
- format (e.g. "UGC testimonial", "founder story", "product demo", "before/after")
- estimated_length ("30s" or "60s")

Return as a JSON array of objects with these fields. Only output the JSON array, no other text.`,

      creative_brief: `Generate a weekly creative brief for ${brandName} based on their data.
${brand_context ? `Brand context: ${brand_context}` : ''}
${target_audience ? `Target audience: ${target_audience}` : ''}
${topKeywords.length > 0 ? `Top performing SEO keywords: ${topKeywords.join(', ')}` : ''}
${topPages.length > 0 ? `Top performing pages: ${topPages.join(', ')}` : ''}
${additional_context ? `Additional context: ${additional_context}` : ''}

Generate a creative brief with:
- objective (what this week's creative should achieve)
- key_message (the core message to communicate)
- audience_insights (based on the data, who to target and why)
- content_ideas (array of 5 specific content/ad ideas, each with title, format, platform, and description)
- messaging_angles (3 different angles to test)
- visual_direction (style guide for this week's creatives)
- keywords_to_leverage (from SEO data, keywords to incorporate into ads)

Return as a single JSON object with these fields. Only output the JSON, no other text.`,
    };

    const prompt = prompts[type];
    if (!prompt) return NextResponse.json({ error: `Unknown type: ${type}. Use: ad_copy, video_script, creative_brief` }, { status: 400 });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err?.error?.message || 'Generation failed' }, { status: 500 });
    }

    const result = await response.json();
    const textContent = (result.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');

    // Parse JSON from response
    let output: any;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, textContent];
      output = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      output = { raw: textContent };
    }

    // Save to DB
    const { data: saved, error: saveError } = await db.from('generated_creatives').insert({
      workspace_id,
      type,
      framework: framework || null,
      prompt,
      output,
      brand_context: brand_context || null,
      target_audience: target_audience || null,
      data_context: dataContext,
    }).select().single();

    if (saveError) console.error('Failed to save generated creative:', saveError);

    return NextResponse.json({ creative: output, id: saved?.id, type, framework });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
