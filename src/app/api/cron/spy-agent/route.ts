import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const META_AD_LIBRARY_URL = 'https://graph.facebook.com/v19.0/ads_archive';

async function callOpenAI(messages: any[], maxTokens: number) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: maxTokens, temperature: 0.4 }),
  });
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
}

function parseJSON(text: string) {
  try { return JSON.parse(text); } catch {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

async function sendSlackAlert(webhookUrl: string, blocks: any[]) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });
  } catch (e) {
    console.error('Slack notification failed:', e);
  }
}

function buildSpySlackBlocks(workspaceName: string, competitorName: string, newAds: number, pausedAds: number, topHeadline: string) {
  return [
    { type: 'header', text: { type: 'plain_text', text: `🕵️ Ad Spy Alert — ${workspaceName}`, emoji: true } },
    { type: 'section', text: { type: 'mrkdwn', text: `*${competitorName}* has changes:\n• *${newAds}* new ad${newAds !== 1 ? 's' : ''} detected\n${pausedAds > 0 ? `• *${pausedAds}* ad${pausedAds !== 1 ? 's' : ''} paused\n` : ''}${topHeadline ? `• Top new ad: _"${topHeadline.slice(0, 80)}"_` : ''}` } },
    { type: 'context', elements: [{ type: 'mrkdwn', text: `<https://lumnix-ai.vercel.app/dashboard/competitors|View in Lumnix>` }] },
    { type: 'divider' },
  ];
}

async function scrapeCompetitorAds(
  db: ReturnType<typeof getSupabaseAdmin>,
  competitor: any,
  metaToken: string
): Promise<{ newAds: number; paused: number; topHeadline: string }> {
  let fbPageId = competitor.fb_page_id;

  // Resolve Page ID if not cached
  if (!fbPageId) {
    const searchTerm = competitor.facebook_page_name || competitor.name;
    const searchRes = await fetch(
      `https://graph.facebook.com/v19.0/search?q=${encodeURIComponent(searchTerm)}&type=page&fields=id,name&access_token=${metaToken}`
    );
    const searchJson = await searchRes.json();
    if (searchJson.data?.[0]) {
      fbPageId = searchJson.data[0].id;
      await db.from('competitor_brands').update({ fb_page_id: fbPageId }).eq('id', competitor.id);
    } else {
      return { newAds: 0, paused: 0, topHeadline: '' };
    }
  }

  // Fetch ads from Meta Ad Library (2 pages max for cron to stay fast)
  const allAds: any[] = [];
  let cursor: string | null = null;
  let page = 0;

  do {
    const params = new URLSearchParams({
      search_page_ids: fbPageId,
      ad_reached_countries: JSON.stringify(['US', 'GB', 'IN', 'CA', 'AU']),
      fields: 'id,ad_creative_bodies,ad_creative_link_titles,ad_creative_link_captions,ad_snapshot_url,impressions,publisher_platforms,ad_delivery_start_time,ad_delivery_stop_time,is_active',
      limit: '100',
      access_token: metaToken,
    });
    if (cursor) params.set('after', cursor);

    const res = await fetch(`${META_AD_LIBRARY_URL}?${params}`);
    const json = await res.json();
    if (json.error) break;

    allAds.push(...(json.data ?? []));
    cursor = json.paging?.cursors?.after ?? null;
    page++;
    await new Promise(r => setTimeout(r, 200));
  } while (cursor && page < 3);

  // Diff against existing ads
  const { data: existing } = await db
    .from('competitor_ads')
    .select('id, ad_archive_id, is_active')
    .eq('competitor_id', competitor.id);

  const existingMap = new Map((existing || []).map((a: any) => [a.ad_archive_id, a]));
  const newAdsToInsert: any[] = [];
  const toUpdate: any[] = [];

  for (const ad of allAds) {
    const isActive = Boolean(ad.is_active);
    const record = {
      competitor_id: competitor.id,
      ad_archive_id: ad.id,
      ad_creative_body: ad.ad_creative_bodies?.[0] ?? null,
      ad_creative_link_title: ad.ad_creative_link_titles?.[0] ?? null,
      is_active: isActive,
      platforms: ad.publisher_platforms ?? [],
      impressions_lower: ad.impressions?.lower_bound ? parseInt(ad.impressions.lower_bound) : null,
      impressions_upper: ad.impressions?.upper_bound ? parseInt(ad.impressions.upper_bound) : null,
      landing_url: ad.ad_snapshot_url ?? null,
      ad_delivery_start_time: ad.ad_delivery_start_time ? new Date(Number(ad.ad_delivery_start_time) * 1000).toISOString() : null,
      ad_delivery_stop_time: ad.ad_delivery_stop_time ? new Date(Number(ad.ad_delivery_stop_time) * 1000).toISOString() : null,
    };

    if (existingMap.has(ad.id)) {
      const prev = existingMap.get(ad.id);
      if (prev.is_active !== isActive) {
        toUpdate.push({ id: prev.id, is_active: isActive, wasPaused: prev.is_active && !isActive });
      }
    } else {
      newAdsToInsert.push(record);
    }
  }

  if (newAdsToInsert.length > 0) {
    await db.from('competitor_ads').insert(newAdsToInsert);
  }

  for (const u of toUpdate) {
    await db.from('competitor_ads').update({ is_active: u.is_active }).eq('id', u.id);
  }

  // Create change alerts
  const alerts: any[] = [];
  newAdsToInsert.slice(0, 10).forEach(ad => {
    alerts.push({
      competitor_id: competitor.id,
      change_type: 'new_ad',
      description: `New ad: "${(ad.ad_creative_link_title ?? ad.ad_creative_body ?? 'Untitled')?.slice(0, 80)}"`,
    });
  });
  toUpdate.filter(u => u.wasPaused).forEach(u => {
    alerts.push({ competitor_id: competitor.id, change_type: 'paused', description: 'An ad was paused' });
  });
  if (alerts.length > 0) {
    await db.from('change_alerts').insert(alerts);
  }

  // Update competitor stats
  const { count: totalCount } = await db.from('competitor_ads').select('*', { count: 'exact', head: true }).eq('competitor_id', competitor.id);
  const { count: activeCount } = await db.from('competitor_ads').select('*', { count: 'exact', head: true }).eq('competitor_id', competitor.id).eq('is_active', true);

  await db.from('competitor_brands').update({
    ad_count: totalCount ?? 0,
    active_ads_count: activeCount ?? 0,
    last_scraped_at: new Date().toISOString(),
    scrape_status: 'idle',
    spy_score: Math.min(100, (activeCount ?? 0) * 2 + Math.floor((totalCount ?? 0) / 5)),
  }).eq('id', competitor.id);

  const topHeadline = newAdsToInsert[0]?.ad_creative_link_title || newAdsToInsert[0]?.ad_creative_body || '';
  return { newAds: newAdsToInsert.length, paused: toUpdate.filter(u => u.wasPaused).length, topHeadline };
}

async function runAIAnalysis(
  db: ReturnType<typeof getSupabaseAdmin>,
  competitorId: string,
  competitorName: string
): Promise<{ analysisId: string; ideasCount: number } | null> {
  // Check for fresh analysis (< 24hrs)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await db
    .from('ai_analysis')
    .select('id')
    .eq('competitor_id', competitorId)
    .gte('created_at', oneDayAgo)
    .limit(1)
    .single();

  if (cached) return null; // Already analysed recently

  // Get top ads for analysis
  const { data: ads } = await db
    .from('competitor_ads')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('is_active', { ascending: false })
    .order('impressions_upper', { ascending: false })
    .limit(60);

  if (!ads || ads.length < 3) return null; // Not enough data

  const adSummary = ads.map((ad: any, i: number) =>
    `[${i + 1}][${ad.is_active ? 'ACTIVE' : 'PAUSED'}] "${ad.ad_creative_link_title ?? 'N/A'}" | "${(ad.ad_creative_body ?? 'N/A').slice(0, 100)}" | Impressions: ${ad.impressions_lower ?? 0}-${ad.impressions_upper ?? 0} | ${(ad.platforms ?? []).join('/')}`
  ).join('\n');

  // Pattern analysis
  const analysisText = await callOpenAI([
    { role: 'system', content: 'You are a performance marketing analyst. Return ONLY valid JSON.' },
    { role: 'user', content: `Analyse ${ads.length} ads from "${competitorName}":\n\n${adSummary}\n\nReturn:\n{"hook_patterns":[{"pattern":string,"count":number,"example":string}],"messaging_angles":[{"angle":string,"strength":"primary|secondary","description":string}],"offer_mechanics":[{"type":string,"frequency":number,"example":string}],"visual_style":string,"spend_estimate":string,"strategy_summary":string}` }
  ], 1500);

  let analysis: any;
  try { analysis = parseJSON(analysisText); } catch { return null; }

  const { data: savedAnalysis } = await db
    .from('ai_analysis')
    .insert({
      competitor_id: competitorId,
      hook_patterns: analysis.hook_patterns ?? [],
      messaging_angles: analysis.messaging_angles ?? [],
      offer_mechanics: analysis.offer_mechanics ?? [],
      visual_style: analysis.visual_style ?? '',
      ads_analysed_count: ads.length,
      raw_output: JSON.stringify(analysis),
    })
    .select('id')
    .single();

  if (!savedAnalysis) return null;

  // Generate counter-strategy ad ideas
  const ideasText = await callOpenAI([
    { role: 'system', content: 'You are a performance marketing strategist. Return ONLY a valid JSON array.' },
    { role: 'user', content: `Competitor "${competitorName}" analysis:\nHook patterns: ${JSON.stringify(analysis.hook_patterns?.slice(0, 3))}\nMessaging: ${JSON.stringify(analysis.messaging_angles?.slice(0, 3))}\nOffers: ${JSON.stringify(analysis.offer_mechanics?.slice(0, 3))}\nStrategy: ${analysis.strategy_summary}\n\nGenerate 5 counter-strategy ad ideas to beat them.\nReturn: [{"hook":string,"body_copy":string,"cta":string,"visual_direction":string,"target_audience":string,"counter_angle":string}]` }
  ], 1500);

  let ideas: any[] = [];
  try { ideas = parseJSON(ideasText); } catch { ideas = []; }

  if (ideas.length > 0) {
    await db.from('ad_ideas').insert(ideas.map((idea: any) => ({
      competitor_id: competitorId,
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

  return { analysisId: savedAnalysis.id, ideasCount: ideas.length };
}

// GET /api/cron/spy-agent — daily at 6am UTC
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const metaToken = process.env.META_ACCESS_TOKEN;
  if (!metaToken) {
    return NextResponse.json({ error: 'META_ACCESS_TOKEN not configured', success: false }, { status: 500 });
  }

  const db = getSupabaseAdmin();
  const results: any[] = [];
  const errors: any[] = [];

  // Get all competitors across all workspaces
  const { data: competitors } = await db
    .from('competitor_brands')
    .select('id, name, facebook_page_name, fb_page_id, workspace_id')
    .order('last_scraped_at', { ascending: true, nullsFirst: true })
    .limit(50); // Process up to 50 competitors per run

  if (!competitors || competitors.length === 0) {
    return NextResponse.json({ success: true, message: 'No competitors to spy on', results: [] });
  }

  for (const competitor of competitors) {
    try {
      // Step 1: Scrape ads
      const scrapeResult = await scrapeCompetitorAds(db, competitor, metaToken);

      // Step 2: AI analysis (only if new ads found or no recent analysis)
      let analysisResult = null;
      if (scrapeResult.newAds > 0 || !competitor.fb_page_id) {
        analysisResult = await runAIAnalysis(db, competitor.id, competitor.name);
      }

      // Step 3: Send Slack notification if new ads found
      if (scrapeResult.newAds > 0 || scrapeResult.paused > 0) {
        const { data: workspace } = await db
          .from('workspaces')
          .select('name, slack_webhook_url')
          .eq('id', competitor.workspace_id)
          .single();

        if (workspace?.slack_webhook_url) {
          await sendSlackAlert(
            workspace.slack_webhook_url,
            buildSpySlackBlocks(
              workspace.name || 'Your workspace',
              competitor.name,
              scrapeResult.newAds,
              scrapeResult.paused,
              scrapeResult.topHeadline
            )
          );
        }
      }

      // Step 4: Save trend snapshot
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        await fetch(`${appUrl}/api/competitors/trends`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ competitor_id: competitor.id }),
        });
      } catch {}

      results.push({
        competitor_id: competitor.id,
        competitor_name: competitor.name,
        ...scrapeResult,
        analysis: analysisResult,
      });

      // Rate limit between competitors
      await new Promise(r => setTimeout(r, 500));
    } catch (e: any) {
      errors.push({ competitor_id: competitor.id, error: e.message });
    }
  }

  return NextResponse.json({
    success: true,
    competitors_processed: results.length,
    total_new_ads: results.reduce((s, r) => s + r.newAds, 0),
    total_paused: results.reduce((s, r) => s + r.paused, 0),
    results,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  });
}
