import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

function getMetaToken(): string | null {
  if (process.env.META_ACCESS_TOKEN) return process.env.META_ACCESS_TOKEN;
  if (process.env.META_APP_ID && process.env.META_APP_SECRET) {
    return `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { workspace_id, competitor_id } = await req.json();
  if (!workspace_id || !competitor_id) {
    return NextResponse.json({ error: 'workspace_id and competitor_id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const token = getMetaToken();
  if (!token) {
    return NextResponse.json({ error: 'Meta token not configured', needsToken: true }, { status: 500 });
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

  // Update status to scraping
  await supabase.from('competitor_brands').update({ scrape_status: 'running' }).eq('id', competitor_id);

  try {
    const pageId = competitor.facebook_page_id || competitor.fb_page_id;
    if (!pageId) {
      await supabase.from('competitor_brands').update({ scrape_status: 'error' }).eq('id', competitor_id);
      return NextResponse.json({ error: 'No Facebook Page ID for this competitor' }, { status: 400 });
    }

    // Fetch ads from Meta Ad Library — paginate through all results
    const allAds: any[] = [];
    let nextUrl: string | null = null;
    let page = 0;
    const MAX_PAGES = 10;

    do {
      let url: string;
      if (nextUrl) {
        url = nextUrl;
      } else {
        const params = new URLSearchParams({
          search_page_ids: pageId,
          ad_type: 'ALL',
          ad_reached_countries: JSON.stringify(['IN', 'US', 'GB', 'AU', 'CA']),
          fields: [
            'id', 'page_id', 'page_name',
            'ad_creative_bodies', 'ad_creative_link_titles', 'ad_creative_link_descriptions',
            'ad_delivery_start_time', 'ad_delivery_stop_time',
            'call_to_action_type', 'ad_snapshot_url',
          ].join(','),
          limit: '100',
          access_token: token,
        });
        url = `https://graph.facebook.com/v19.0/ads_archive?${params}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.error) {
        console.error('Meta API error during scrape:', json.error);
        if (json.error.code === 200 || json.error.type === 'OAuthException') {
          await supabase.from('competitor_brands').update({ scrape_status: 'error' }).eq('id', competitor_id);
          return NextResponse.json({ error: 'Accept Meta Ad Library ToS at facebook.com/ads/library/api/', needsToS: true });
        }
        if (json.error.code === 4) {
          // Rate limited — wait and retry once
          await new Promise(r => setTimeout(r, 60000));
          continue;
        }
        break;
      }

      allAds.push(...(json.data ?? []));
      nextUrl = json.paging?.next ?? null;
      page++;
      // Small delay between pages to avoid rate limits
      if (nextUrl) await new Promise(r => setTimeout(r, 300));
    } while (nextUrl && page < MAX_PAGES);

    // Process each ad: calculate days_running and performance_tier
    const today = new Date();
    const upsertRows: any[] = [];
    let winningCount = 0;

    for (const ad of allAds) {
      const startTime = ad.ad_delivery_start_time;
      const stopTime = ad.ad_delivery_stop_time;
      const startDate = startTime ? new Date(startTime) : null;
      const stopDate = stopTime ? new Date(stopTime) : today;
      const daysRunning = startDate ? Math.floor((stopDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const isActive = !stopTime;

      let performanceTier = 'active';
      if (daysRunning >= 180) performanceTier = 'top_performer';
      else if (daysRunning >= 90) performanceTier = 'winning';

      if (performanceTier !== 'active') winningCount++;

      upsertRows.push({
        workspace_id,
        competitor_id,
        meta_ad_id: ad.id,
        page_id: ad.page_id || pageId,
        page_name: ad.page_name || competitor.name,
        ad_copy: ad.ad_creative_bodies?.[0] || null,
        headline: ad.ad_creative_link_titles?.[0] || null,
        description: ad.ad_creative_link_descriptions?.[0] || null,
        call_to_action: ad.call_to_action_type || null,
        ad_snapshot_url: ad.ad_snapshot_url || null,
        ad_delivery_start_time: startTime || null,
        ad_delivery_stop_time: stopTime || null,
        days_running: daysRunning,
        is_active: isActive,
        performance_tier: performanceTier,
        scraped_at: new Date().toISOString(),
      });
    }

    // Batch upsert in chunks of 200
    const CHUNK_SIZE = 200;
    for (let i = 0; i < upsertRows.length; i += CHUNK_SIZE) {
      const chunk = upsertRows.slice(i, i + CHUNK_SIZE);
      const { error: upsertErr } = await supabase
        .from('competitor_ads')
        .upsert(chunk, { onConflict: 'workspace_id,meta_ad_id' });
      if (upsertErr) {
        console.error('Upsert error:', upsertErr);
      }
    }

    // Update competitor stats
    await supabase.from('competitor_brands').update({
      scrape_status: 'idle',
      last_scraped_at: new Date().toISOString(),
      total_ads_found: allAds.length,
      winning_ads_count: winningCount,
      ad_count: allAds.length,
      active_ads_count: upsertRows.filter(r => r.is_active).length,
    }).eq('id', competitor_id);

    // Trigger AI analysis if there are winning ads
    if (winningCount > 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      fetch(`${appUrl}/api/competitors/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitor_id, workspace_id }),
      }).catch(() => {});
    }

    return NextResponse.json({
      adsFound: allAds.length,
      winningAds: winningCount,
      saved: upsertRows.length,
    });
  } catch (err: any) {
    console.error('Scrape error:', err);
    await supabase.from('competitor_brands').update({ scrape_status: 'error' }).eq('id', competitor_id);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
