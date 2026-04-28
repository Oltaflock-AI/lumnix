import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { callClaude } from '@/lib/anthropic';
import { rateLimit } from '@/lib/rate-limit';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

// GET /api/competitors/keyword-gap?workspace_id=xxx&competitor_id=yyy
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  const competitorId = req.nextUrl.searchParams.get('competitor_id');

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
  }

  const auth = await verifyWorkspaceAccess(req, workspaceId);
  if (auth instanceof NextResponse) return auth;

  const db = getSupabaseAdmin();

  if (competitorId) {
    // Return cached results for specific competitor
    const { data, error } = await db
      .from('keyword_gaps')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('competitor_id', competitorId)
      .order('analyzed_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ gaps: data || [] });
  }

  // Return all gaps for workspace
  const { data, error } = await db
    .from('keyword_gaps')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('analyzed_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ gaps: data || [] });
}

// POST /api/competitors/keyword-gap — trigger fresh analysis
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { workspace_id, competitor_id } = body;

  const auth = await verifyWorkspaceAccess(req, workspace_id);
  if (auth instanceof NextResponse) return auth;

  // Rate limit: 3 analysis requests per minute per workspace
  if (workspace_id) {
    const rateLimited = rateLimit(`kwgap:${workspace_id}`, 3, 60 * 1000);
    if (rateLimited) return rateLimited;
  }

  if (!workspace_id || !competitor_id) {
    return NextResponse.json({ error: 'workspace_id and competitor_id required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // IDOR fix: scope competitor to caller's workspace so users can't run
  // paid Claude analysis / Jina scrapes against another workspace's domain.
  const { data: competitor, error: compError } = await db
    .from('competitors')
    .select('*')
    .eq('id', competitor_id)
    .eq('workspace_id', workspace_id)
    .single();

  if (compError || !competitor) {
    return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
  }

  // Get workspace's top GSC keywords
  const { data: gscData } = await db
    .from('gsc_data')
    .select('query, clicks, impressions, position')
    .eq('workspace_id', workspace_id)
    .order('clicks', { ascending: false })
    .limit(200);

  const myKeywords = new Set((gscData || []).map(r => r.query?.toLowerCase()).filter(Boolean));
  const myKeywordsList = Array.from(myKeywords).slice(0, 100);

  // Scrape competitor pages via Jina.ai
  const competitorDomain = competitor.domain || competitor.name;
  let scrapedContent = '';

  try {
    // Try sitemap first
    const sitemapUrl = `https://r.jina.ai/https://${competitorDomain.replace(/^https?:\/\//, '')}/sitemap.xml`;
    const sitemapRes = await fetch(sitemapUrl, {
      headers: { 'Accept': 'text/plain' },
      signal: AbortSignal.timeout(15000),
    });

    if (sitemapRes.ok) {
      const sitemapText = await sitemapRes.text();
      // Extract URLs from sitemap
      const urlMatches = sitemapText.match(/https?:\/\/[^\s<>"]+/g) || [];
      const pageUrls = urlMatches
        .filter(u => !u.includes('.xml') && !u.includes('.gz'))
        .slice(0, 10);

      // Scrape top pages
      for (const pageUrl of pageUrls.slice(0, 5)) {
        try {
          const pageRes = await fetch(`https://r.jina.ai/${pageUrl}`, {
            headers: { 'Accept': 'text/plain' },
            signal: AbortSignal.timeout(10000),
          });
          if (pageRes.ok) {
            const text = await pageRes.text();
            scrapedContent += text.slice(0, 2000) + '\n\n---\n\n';
          }
        } catch {
          // Skip failed pages
        }
      }
    }
  } catch {
    // Sitemap failed, try homepage
  }

  // If no sitemap content, try homepage directly
  if (!scrapedContent) {
    try {
      const homeUrl = `https://r.jina.ai/https://${competitorDomain.replace(/^https?:\/\//, '')}`;
      const homeRes = await fetch(homeUrl, {
        headers: { 'Accept': 'text/plain' },
        signal: AbortSignal.timeout(15000),
      });
      if (homeRes.ok) {
        scrapedContent = (await homeRes.text()).slice(0, 8000);
      }
    } catch {
      return NextResponse.json({ error: 'Could not scrape competitor website' }, { status: 400 });
    }
  }

  if (!scrapedContent) {
    return NextResponse.json({ error: 'No content could be scraped from competitor' }, { status: 400 });
  }

  // Use Claude to extract keywords and find gaps
  const systemPrompt = `You are an SEO keyword gap analyst. Given scraped content from a competitor website and a list of keywords the user already ranks for, identify keyword GAPS — keywords the competitor is likely targeting that the user does NOT rank for.

For each gap keyword, provide:
- keyword: the target keyword (2-5 words, search-friendly)
- competitor_url: the competitor page likely targeting it (best guess from context)
- difficulty: "low", "medium", or "high" based on keyword competitiveness
- recommended_action: brief actionable advice (e.g., "Create a blog post about X", "Add a landing page for Y")

Return a JSON object with a "gaps" key containing an array. Return 10-20 keyword gaps, prioritizing high-value opportunities. Only output JSON.`;

  const aiText = await callClaude(
    [{ role: 'user', content: `Competitor domain: ${competitorDomain}\n\nMy current keywords (I already rank for these — do NOT include them as gaps):\n${myKeywordsList.join(', ')}\n\nCompetitor scraped content:\n${scrapedContent.slice(0, 6000)}` }],
    { maxTokens: 2000, system: systemPrompt },
  );

  let gaps: any[] = [];
  try {
    const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiText];
    const parsed = JSON.parse(jsonMatch[1]!.trim());
    gaps = parsed.gaps || parsed.keywords || parsed.results || [];
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  if (gaps.length === 0) {
    return NextResponse.json({ gaps: [], message: 'No keyword gaps found' });
  }

  // Clear old gaps for this competitor
  await db
    .from('keyword_gaps')
    .delete()
    .eq('workspace_id', workspace_id)
    .eq('competitor_id', competitor_id);

  // Insert new gaps
  const inserts = gaps.map(g => ({
    workspace_id,
    competitor_id,
    keyword: g.keyword,
    competitor_url: g.competitor_url || null,
    difficulty: g.difficulty || 'medium',
    recommended_action: g.recommended_action || null,
    analyzed_at: new Date().toISOString(),
  }));

  const { error: insertError } = await db.from('keyword_gaps').insert(inserts);
  if (insertError) {
    return NextResponse.json({ error: 'Failed to save keyword gaps' }, { status: 500 });
  }

  return NextResponse.json({ gaps: inserts, count: inserts.length });
}
