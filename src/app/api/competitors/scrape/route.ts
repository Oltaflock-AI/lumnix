import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

async function analyzeAdWithAI(adCopy: string, openaiKey: string) {
  if (!openaiKey || openaiKey === 'placeholder' || !adCopy?.trim()) return {};
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Analyze this ad copy. Return JSON with: angle (core value proposition in 3 words), hook (the opening hook), cta (call to action phrase), tone (ONE of: professional/casual/urgent/emotional), summary (1 compelling sentence about what makes this ad work). Ad: "${adCopy.slice(0, 500)}"`,
        }],
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    return JSON.parse(data.choices?.[0]?.message?.content || '{}');
  } catch { return {}; }
}

async function scrapeViaMetaAPI(searchTerms: string, appId: string, appSecret: string) {
  const appToken = `${appId}|${appSecret}`;
  const params = new URLSearchParams({
    access_token: appToken,
    search_terms: searchTerms,
    ad_reached_countries: '["US","GB","CA","AU","IN"]',
    ad_type: 'ALL',
    fields: [
      'id', 'ad_creative_bodies', 'ad_creative_link_titles', 'ad_creative_link_descriptions',
      'page_name', 'funding_entity', 'ad_delivery_start_time', 'ad_delivery_stop_time',
      'impressions', 'spend', 'publisher_platforms', 'ad_snapshot_url',
    ].join(','),
    limit: '50',
  });

  const res = await fetch(`https://graph.facebook.com/v19.0/ads_archive?${params}`);
  const data = await res.json();

  if (data.error) {
    console.log('Meta API error:', data.error);
    return { ads: [], error: data.error.message };
  }

  return { ads: data.data || [], error: null };
}

async function scrapeViaApify(searchTerms: string, apifyToken: string) {
  try {
    const runRes = await fetch('https://api.apify.com/v2/acts/apify~facebook-ads-scraper/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apifyToken}` },
      body: JSON.stringify({
        searchTerms: [searchTerms],
        adType: 'ALL',
        adActiveStatus: 'ALL',
        country: 'US',
        maxAds: 30,
      }),
    });
    const runData = await runRes.json();
    if (!runData.data?.id) return [];

    // Wait for run to complete (max 30s)
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runData.data.id}`, {
        headers: { Authorization: `Bearer ${apifyToken}` },
      });
      const status = await statusRes.json();
      if (status.data?.status === 'SUCCEEDED') {
        const dataRes = await fetch(`https://api.apify.com/v2/datasets/${status.data.defaultDatasetId}/items`, {
          headers: { Authorization: `Bearer ${apifyToken}` },
        });
        return await dataRes.json();
      }
      if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status.data?.status)) break;
    }
  } catch (e) { console.error('Apify error:', e); }
  return [];
}

export async function POST(req: NextRequest) {
  const { workspace_id, competitor_id } = await req.json();
  if (!workspace_id || !competitor_id) {
    return NextResponse.json({ error: 'workspace_id and competitor_id required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Get competitor from either table name
  let competitor: any = null;
  const { data: c1 } = await db.from('competitor_brands').select('*').eq('id', competitor_id).eq('workspace_id', workspace_id).single();
  if (c1) { competitor = c1; }
  else {
    const { data: c2 } = await db.from('competitors').select('*').eq('id', competitor_id).eq('workspace_id', workspace_id).single();
    if (c2) competitor = c2;
  }

  if (!competitor) return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });

  const searchTerms = competitor.facebook_page_name || competitor.name;
  const appId = process.env.META_APP_ID || '';
  const appSecret = process.env.META_APP_SECRET || '';
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const apifyToken = process.env.APIFY_TOKEN || 'apify_api_loBkRHjHoKvPAvY2v9d46fVPtpfH9i2aBacx';

  // Try Meta API first
  let rawAds: any[] = [];
  const { ads: metaAds, error: metaError } = await scrapeViaMetaAPI(searchTerms, appId, appSecret);

  if (metaAds.length > 0) {
    rawAds = metaAds;
  } else {
    // Fallback to Apify if Meta fails or returns nothing
    console.log('Meta returned 0 ads, trying Apify fallback. Meta error:', metaError);
    const apifyAds = await scrapeViaApify(searchTerms, apifyToken);
    rawAds = apifyAds;
  }

  if (rawAds.length === 0) {
    return NextResponse.json({
      success: true,
      adsFound: 0,
      message: metaError ? `Meta API error: ${metaError}` : 'No ads found for this competitor. Try their exact Facebook page name.',
    });
  }

  // Process and store ads
  const adsToUpsert: any[] = [];
  for (const ad of rawAds) {
    const adCopy = (ad.ad_creative_bodies || ad.bodyText || [])?.[0] || ad.text || '';
    const aiData = await analyzeAdWithAI(adCopy, openaiKey);

    adsToUpsert.push({
      workspace_id,
      competitor_id,
      ad_archive_id: ad.id || ad.adArchiveID || `${competitor_id}-${Date.now()}-${Math.random()}`,
      ad_creative_body: adCopy,
      ad_creative_link_title: (ad.ad_creative_link_titles || [])[0] || ad.title || null,
      ad_creative_link_description: (ad.ad_creative_link_descriptions || [])[0] || null,
      page_name: ad.page_name || ad.pageName || competitor.name,
      funding_entity: ad.funding_entity || null,
      ad_delivery_start_time: ad.ad_delivery_start_time || ad.startDate || null,
      ad_delivery_stop_time: ad.ad_delivery_stop_time || ad.endDate || null,
      impressions_lower_bound: ad.impressions?.lower_bound || null,
      impressions_upper_bound: ad.impressions?.upper_bound || null,
      spend_lower_bound: ad.spend?.lower_bound || null,
      spend_upper_bound: ad.spend?.upper_bound || null,
      currency: ad.spend?.currency || 'USD',
      platforms: ad.publisher_platforms || ad.publisherPlatforms || ['facebook'],
      snapshot_url: ad.ad_snapshot_url || ad.snapshotUrl || null,
      ai_angle: aiData.angle || null,
      ai_hook: aiData.hook || null,
      ai_cta: aiData.cta || null,
      ai_tone: aiData.tone || null,
      ai_summary: aiData.summary || null,
      is_active: !ad.ad_delivery_stop_time && !ad.endDate,
      scraped_at: new Date().toISOString(),
    });
  }

  // Determine table to insert into
  const tableName = competitor.facebook_page_name !== undefined ? 'competitor_ads' : 'competitor_ads';
  if (adsToUpsert.length > 0) {
    const { error: upsertErr } = await db.from(tableName).upsert(adsToUpsert, { onConflict: 'ad_archive_id' });
    if (upsertErr) console.error('Upsert error:', upsertErr);
  }

  // Update competitor ad count
  await db.from('competitor_brands').update({ ad_count: adsToUpsert.length, last_scraped_at: new Date().toISOString() }).eq('id', competitor_id);
  await db.from('competitors').update({ last_scraped_at: new Date().toISOString() }).eq('id', competitor_id);

  return NextResponse.json({ success: true, adsFound: adsToUpsert.length });
}
