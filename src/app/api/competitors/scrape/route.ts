import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

async function getMetaToken(db: ReturnType<typeof getSupabaseAdmin>, workspaceId: string): Promise<string | null> {
  // First check env var
  if (process.env.META_ACCESS_TOKEN) return process.env.META_ACCESS_TOKEN;

  // Then check workspace's connected Meta integration
  const { data: integration } = await db
    .from('integrations')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'meta_ads')
    .eq('status', 'connected')
    .single();

  if (integration) {
    const { data: token } = await db
      .from('oauth_tokens')
      .select('access_token')
      .eq('integration_id', integration.id)
      .single();
    if (token?.access_token) return token.access_token;
  }

  return null;
}

export async function POST(req: NextRequest) {
  const { workspace_id, competitor_id } = await req.json();
  if (!workspace_id || !competitor_id) {
    return NextResponse.json({ error: 'workspace_id and competitor_id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const META_ACCESS_TOKEN = await getMetaToken(supabase, workspace_id);
  if (!META_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Meta token not configured. Connect Meta Ads in Settings or set META_ACCESS_TOKEN env var.', adsFound: 0, needsToken: true });
  }

  // Get competitor
  const { data: competitor, error: compErr } = await supabase
    .from('competitor_brands')
    .select('*')
    .eq('id', competitor_id)
    .eq('workspace_id', workspace_id)
    .single();

  if (compErr || !competitor) {
    return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
  }

  // Set scrape_status = running
  await supabase.from('competitor_brands').update({ scrape_status: 'running' }).eq('id', competitor_id);

  try {
    let fbPageId = competitor.fb_page_id;
    const searchTerm = competitor.facebook_page_name || competitor.name;

    // Resolve Page ID if not cached
    if (!fbPageId) {
      // Method 1: Try Pages Search API
      try {
        const searchRes = await fetch(
          `https://graph.facebook.com/v19.0/search?q=${encodeURIComponent(searchTerm)}&type=page&fields=id,name&access_token=${META_ACCESS_TOKEN}`
        );
        const searchJson = await searchRes.json();
        if (searchJson.data?.[0]) {
          fbPageId = searchJson.data[0].id;
        }
      } catch {}

      // Method 2: If search failed, try searching the Ad Library directly by term
      // This works without a Page ID — searches across all advertisers
      if (!fbPageId) {
        const termParams = new URLSearchParams({
          search_terms: searchTerm,
          ad_reached_countries: JSON.stringify(['US', 'GB', 'IN', 'CA', 'AU']),
          fields: 'id,ad_creative_bodies,ad_creative_link_titles,ad_creative_link_captions,ad_snapshot_url,impressions,publisher_platforms,ad_delivery_start_time,ad_delivery_stop_time,is_active,page_id,page_name',
          limit: '50',
          access_token: META_ACCESS_TOKEN,
        });

        const termRes = await fetch(`https://graph.facebook.com/v19.0/ads_archive?${termParams}`);
        const termJson = await termRes.json();

        if (termJson.error) {
          if (termJson.error.code === 200 || termJson.error.type === 'OAuthException') {
            await supabase.from('competitor_brands').update({ scrape_status: 'error' }).eq('id', competitor_id);
            return NextResponse.json({ error: 'Please accept the Meta Ad Library Terms of Service at facebook.com/ads/library/api/', adsFound: 0, needsToS: true });
          }
          await supabase.from('competitor_brands').update({ scrape_status: 'error' }).eq('id', competitor_id);
          return NextResponse.json({ error: `Meta API error: ${termJson.error.message}`, adsFound: 0 });
        }

        if (termJson.data && termJson.data.length > 0) {
          // Extract page_id from first result if available
          const firstAd = termJson.data[0];
          if (firstAd.page_id) {
            fbPageId = firstAd.page_id;
          }

          // Even without page_id, we already have ads — save them directly
          const allAds = termJson.data;
          return await processAndSaveAds(supabase, competitor_id, allAds, META_ACCESS_TOKEN, fbPageId);
        }

        await supabase.from('competitor_brands').update({ scrape_status: 'error' }).eq('id', competitor_id);
        return NextResponse.json({
          error: `No ads found for "${searchTerm}". Try setting the Facebook Page Name when adding the competitor (e.g., "apple" for Apple's page).`,
          adsFound: 0,
        });
      }

      // Cache the resolved page ID
      if (fbPageId) {
        await supabase.from('competitor_brands').update({ fb_page_id: fbPageId }).eq('id', competitor_id);
      }
    }

    // Fetch ads from Meta Ad Library by Page ID
    const allAds: any[] = [];
    let cursor: string | null = null;
    let page = 0;
    const MAX_PAGES = 5;

    do {
      const params = new URLSearchParams({
        search_page_ids: fbPageId,
        ad_reached_countries: JSON.stringify(['US', 'GB', 'IN', 'CA', 'AU']),
        fields: 'id,ad_creative_bodies,ad_creative_link_titles,ad_creative_link_captions,ad_snapshot_url,impressions,publisher_platforms,ad_delivery_start_time,ad_delivery_stop_time,is_active',
        limit: '100',
        access_token: META_ACCESS_TOKEN,
      });
      if (cursor) params.set('after', cursor);

      const res = await fetch(`https://graph.facebook.com/v19.0/ads_archive?${params}`);
      const json = await res.json();

      if (json.error) {
        console.error('Meta API error:', json.error);
        if (json.error.code === 200 || json.error.type === 'OAuthException') {
          await supabase.from('competitor_brands').update({ scrape_status: 'error' }).eq('id', competitor_id);
          return NextResponse.json({ error: 'Please accept the Meta Ad Library Terms of Service at facebook.com/ads/library/api/', adsFound: 0, needsToS: true });
        }
        break;
      }

      allAds.push(...(json.data ?? []));
      cursor = json.paging?.cursors?.after ?? null;
      page++;
      await new Promise(r => setTimeout(r, 200));
    } while (cursor && page < MAX_PAGES);

    return await processAndSaveAds(supabase, competitor_id, allAds, META_ACCESS_TOKEN, fbPageId);
  } catch (err: any) {
    await supabase.from('competitor_brands').update({ scrape_status: 'error' }).eq('id', competitor_id);
    return NextResponse.json({ error: err.message, adsFound: 0 }, { status: 500 });
  }
}

async function processAndSaveAds(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  competitor_id: string,
  allAds: any[],
  token: string,
  fbPageId: string | null
) {
  // Get existing ad archive IDs
  const { data: existing } = await supabase
    .from('competitor_ads')
    .select('id, ad_archive_id, is_active')
    .eq('competitor_id', competitor_id);

  const existingMap = new Map((existing || []).map((a: any) => [a.ad_archive_id, a]));

  const newAdsToInsert: any[] = [];
  const toUpdate: any[] = [];

  for (const ad of allAds) {
    const isActive = Boolean(ad.is_active);
    const record = {
      competitor_id,
      ad_archive_id: ad.id,
      ad_creative_body: ad.ad_creative_bodies?.[0] ?? null,
      ad_creative_link_title: ad.ad_creative_link_titles?.[0] ?? null,
      is_active: isActive,
      platforms: ad.publisher_platforms ?? [],
      impressions_lower: ad.impressions?.lower_bound ? parseInt(ad.impressions.lower_bound) : null,
      impressions_upper: ad.impressions?.upper_bound ? parseInt(ad.impressions.upper_bound) : null,
      landing_url: ad.ad_snapshot_url ?? null,
      ad_delivery_start_time: ad.ad_delivery_start_time
        ? new Date(Number(ad.ad_delivery_start_time) * 1000).toISOString()
        : null,
      ad_delivery_stop_time: ad.ad_delivery_stop_time
        ? new Date(Number(ad.ad_delivery_stop_time) * 1000).toISOString()
        : null,
    };

    if (existingMap.has(ad.id)) {
      const prev = existingMap.get(ad.id);
      if (prev.is_active !== isActive) toUpdate.push({ id: prev.id, is_active: isActive, wasPaused: prev.is_active && !isActive });
    } else {
      newAdsToInsert.push(record);
    }
  }

  if (newAdsToInsert.length > 0) {
    await supabase.from('competitor_ads').insert(newAdsToInsert);
  }

  for (const u of toUpdate) {
    await supabase.from('competitor_ads').update({ is_active: u.is_active }).eq('id', u.id);
  }

  // Create change alerts
  const alerts: any[] = [];
  newAdsToInsert.slice(0, 10).forEach(ad => {
    alerts.push({
      competitor_id,
      change_type: 'new_ad',
      description: `New ad: "${(ad.ad_creative_link_title ?? ad.ad_creative_body ?? 'No headline')?.slice(0, 60)}"`,
    });
  });
  toUpdate.filter(u => u.wasPaused).slice(0, 5).forEach(u => {
    alerts.push({ competitor_id, change_type: 'paused', description: 'An ad was paused' });
  });
  if (alerts.length > 0) {
    await supabase.from('change_alerts').insert(alerts);
  }

  // Update competitor stats
  const { count: totalCount } = await supabase.from('competitor_ads').select('*', { count: 'exact', head: true }).eq('competitor_id', competitor_id);
  const { count: activeCount } = await supabase.from('competitor_ads').select('*', { count: 'exact', head: true }).eq('competitor_id', competitor_id).eq('is_active', true);
  const total = totalCount ?? 0;
  const active = activeCount ?? 0;

  await supabase.from('competitor_brands').update({
    ad_count: total,
    active_ads_count: active,
    last_scraped_at: new Date().toISOString(),
    scrape_status: 'idle',
    spy_score: Math.min(100, active * 2 + Math.floor(total / 5)),
  }).eq('id', competitor_id);

  return NextResponse.json({ adsFound: total, newAds: newAdsToInsert.length, updated: toUpdate.length });
}
