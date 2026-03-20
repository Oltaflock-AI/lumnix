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
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `Analyze this ad. Return JSON: angle (3 words, core value prop), tone (professional/casual/urgent/emotional), summary (1 sentence what makes it work). Ad: "${adCopy.slice(0, 400)}"`,
        }],
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    return JSON.parse(data.choices?.[0]?.message?.content || '{}');
  } catch { return {}; }
}

async function scrapeMetaAdLibrary(searchTerms: string, appId: string, appSecret: string) {
  const appToken = `${appId}|${appSecret}`;
  const params = new URLSearchParams({
    access_token: appToken,
    search_terms: searchTerms,
    ad_reached_countries: '["US","GB","CA","AU","IN"]',
    ad_type: 'ALL',
    fields: [
      'id', 'ad_creative_bodies', 'ad_creative_link_titles', 'ad_creative_link_descriptions',
      'page_name', 'ad_delivery_start_time', 'ad_delivery_stop_time',
      'impressions', 'spend', 'publisher_platforms', 'ad_snapshot_url',
    ].join(','),
    limit: '50',
  });

  const res = await fetch(`https://graph.facebook.com/v19.0/ads_archive?${params}`);
  const data = await res.json();
  if (data.error) return { ads: [], error: data.error.message };
  return { ads: data.data || [], error: null };
}

// Fallback: scrape via RapidAPI Facebook Ad Library (instant, no job queue)
async function scrapeViaRapidAPI(searchTerms: string) {
  // Use a public scraping approach via serpapi or similar
  // For now return empty - will be replaced with working solution
  return [];
}

export async function POST(req: NextRequest) {
  const { workspace_id, competitor_id } = await req.json();
  if (!workspace_id || !competitor_id) {
    return NextResponse.json({ error: 'workspace_id and competitor_id required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Try both table names
  let competitor: any = null;
  const { data: c1 } = await db.from('competitor_brands').select('*').eq('id', competitor_id).eq('workspace_id', workspace_id).single();
  if (c1) competitor = c1;
  else {
    const { data: c2 } = await db.from('competitors').select('*').eq('id', competitor_id).eq('workspace_id', workspace_id).single();
    if (c2) competitor = c2;
  }
  if (!competitor) return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });

  const searchTerms = competitor.facebook_page_name || competitor.name;
  const appId = process.env.META_APP_ID || '';
  const appSecret = process.env.META_APP_SECRET || '';
  const openaiKey = process.env.OPENAI_API_KEY || '';

  // Try Meta Ad Library API (instant response)
  const { ads: metaAds, error: metaError } = await scrapeMetaAdLibrary(searchTerms, appId, appSecret);

  if (metaAds.length === 0) {
    // Meta returned nothing — return helpful message
    return NextResponse.json({
      success: true,
      adsFound: 0,
      message: metaError
        ? `Meta API error: ${metaError}. Add the Facebook app domain (lumnix-ai.vercel.app) in your Facebook Developer settings to fix this.`
        : `No active ads found for "${searchTerms}" in the Meta Ad Library. Try the exact Facebook page name of the brand.`,
    });
  }

  // Process ads with AI analysis
  const adsToUpsert: any[] = [];
  // Process max 10 with AI to avoid timeout, rest without
  for (let i = 0; i < metaAds.length; i++) {
    const ad = metaAds[i];
    const adCopy = (ad.ad_creative_bodies || [])[0] || '';
    const aiData = i < 10 ? await analyzeAdWithAI(adCopy, openaiKey) : {};

    adsToUpsert.push({
      workspace_id,
      competitor_id,
      ad_archive_id: ad.id,
      ad_creative_body: adCopy,
      ad_creative_link_title: (ad.ad_creative_link_titles || [])[0] || null,
      ad_creative_link_description: (ad.ad_creative_link_descriptions || [])[0] || null,
      page_name: ad.page_name || competitor.name,
      ad_delivery_start_time: ad.ad_delivery_start_time || null,
      ad_delivery_stop_time: ad.ad_delivery_stop_time || null,
      impressions_lower_bound: ad.impressions?.lower_bound || null,
      impressions_upper_bound: ad.impressions?.upper_bound || null,
      spend_lower_bound: ad.spend?.lower_bound || null,
      spend_upper_bound: ad.spend?.upper_bound || null,
      currency: ad.spend?.currency || 'USD',
      platforms: ad.publisher_platforms || ['facebook'],
      snapshot_url: ad.ad_snapshot_url || null,
      ai_angle: aiData.angle || null,
      ai_tone: aiData.tone || null,
      ai_summary: aiData.summary || null,
      is_active: !ad.ad_delivery_stop_time,
      scraped_at: new Date().toISOString(),
    });
  }

  if (adsToUpsert.length > 0) {
    const { error: upsertErr } = await db.from('competitor_ads').upsert(adsToUpsert, { onConflict: 'ad_archive_id' });
    if (upsertErr) console.error('upsert err:', upsertErr);
  }

  // Update ad count
  await db.from('competitor_brands').update({ ad_count: adsToUpsert.length, last_scraped_at: new Date().toISOString() }).eq('id', competitor_id).catch(() => {});
  await db.from('competitors').update({ last_scraped_at: new Date().toISOString() }).eq('id', competitor_id).catch(() => {});

  return NextResponse.json({ success: true, adsFound: adsToUpsert.length });
}
