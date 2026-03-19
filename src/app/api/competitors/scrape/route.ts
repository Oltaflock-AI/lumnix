import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  const { workspace_id, competitor_id } = await req.json();
  if (!workspace_id || !competitor_id) {
    return NextResponse.json({ error: 'workspace_id and competitor_id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: competitor, error: compError } = await supabase
    .from('competitor_brands')
    .select('*')
    .eq('id', competitor_id)
    .eq('workspace_id', workspace_id)
    .single();

  if (compError || !competitor) {
    return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
  }

  // App access token: APP_ID|APP_SECRET
  const appAccessToken = `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`;
  const searchTerms = competitor.facebook_page_name || competitor.name;

  const params = new URLSearchParams({
    access_token: appAccessToken,
    search_terms: searchTerms,
    ad_reached_countries: '["US"]',
    ad_type: 'ALL',
    fields: 'id,ad_creative_bodies,ad_creative_link_titles,ad_creative_link_descriptions,page_name,funding_entity,ad_delivery_start_time,ad_delivery_stop_time,impressions,spend,publisher_platforms,ad_snapshot_url',
    limit: '50',
  });

  let metaAds: any[] = [];
  try {
    const metaRes = await fetch(`https://graph.facebook.com/v19.0/ads_archive?${params}`);
    const metaData = await metaRes.json();
    if (metaData.data) {
      metaAds = metaData.data;
    } else {
      console.log('Meta Ad Library response:', JSON.stringify(metaData));
    }
  } catch (e) {
    console.error('Meta API error:', e);
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const adsToUpsert: any[] = [];

  for (const ad of metaAds) {
    const adCopy = (ad.ad_creative_bodies || [])[0] || '';

    let aiAngle = null, aiHook = null, aiCta = null, aiTone = null, aiSummary = null;

    if (openaiKey && openaiKey !== 'placeholder' && adCopy) {
      try {
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: `Analyze this ad copy and return JSON with: angle (the core value prop/angle), hook (the opening hook), cta (call to action), tone (professional/casual/urgent/emotional), summary (1 sentence). Ad copy: ${adCopy}`,
            }],
            response_format: { type: 'json_object' },
          }),
        });
        const aiData = await aiRes.json();
        const parsed = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');
        aiAngle = parsed.angle || null;
        aiHook = parsed.hook || null;
        aiCta = parsed.cta || null;
        aiTone = parsed.tone || null;
        aiSummary = parsed.summary || null;
      } catch (e) {
        console.error('OpenAI error:', e);
      }
    }

    adsToUpsert.push({
      workspace_id,
      competitor_id,
      ad_archive_id: ad.id,
      ad_creative_body: adCopy,
      ad_creative_link_title: (ad.ad_creative_link_titles || [])[0] || null,
      ad_creative_link_description: (ad.ad_creative_link_descriptions || [])[0] || null,
      page_name: ad.page_name || null,
      funding_entity: ad.funding_entity || null,
      ad_delivery_start_time: ad.ad_delivery_start_time || null,
      ad_delivery_stop_time: ad.ad_delivery_stop_time || null,
      impressions_lower_bound: ad.impressions?.lower_bound || null,
      impressions_upper_bound: ad.impressions?.upper_bound || null,
      spend_lower_bound: ad.spend?.lower_bound || null,
      spend_upper_bound: ad.spend?.upper_bound || null,
      currency: ad.spend?.currency || null,
      platforms: ad.publisher_platforms || [],
      snapshot_url: ad.ad_snapshot_url || null,
      ai_angle: aiAngle,
      ai_hook: aiHook,
      ai_cta: aiCta,
      ai_tone: aiTone,
      ai_summary: aiSummary,
      is_active: !ad.ad_delivery_stop_time,
      scraped_at: new Date().toISOString(),
    });
  }

  if (adsToUpsert.length > 0) {
    const { error: upsertErr } = await supabase
      .from('competitor_ads')
      .upsert(adsToUpsert, { onConflict: 'ad_archive_id' });
    if (upsertErr) console.error('Upsert error:', upsertErr);
  }

  return NextResponse.json({ success: true, adsFound: adsToUpsert.length });
}
