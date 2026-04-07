import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/data/unified?workspace_id=...&days=30
// Returns combined metrics from all 4 sources in a single response
export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspace_id');
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = new Date().toISOString().split('T')[0];

    const db = getSupabaseAdmin();

    // Fetch all 4 sources in parallel
    const [gscResult, ga4Result, googleAdsResult, metaAdsResult, integrationsResult] = await Promise.all([
      // GSC: daily clicks + impressions
      db.from('gsc_data')
        .select('date, clicks, impressions')
        .eq('workspace_id', workspaceId)
        .gte('date', startDateStr)
        .lte('date', endDateStr),

      // GA4: sessions + users
      db.from('ga4_data')
        .select('date, metric_type, dimension_name, value')
        .eq('workspace_id', workspaceId)
        .gte('date', startDateStr)
        .lte('date', endDateStr),

      // Google Ads: from google_ads_data or analytics_data fallback
      db.from('google_ads_data')
        .select('date, clicks, impressions, cost, conversions, conversions_value')
        .eq('workspace_id', workspaceId)
        .gte('date', startDateStr)
        .lte('date', endDateStr),

      // Meta Ads: from meta_ads_data or analytics_data fallback
      db.from('meta_ads_data')
        .select('date, clicks, impressions, spend, reach, conversions, revenue')
        .eq('workspace_id', workspaceId)
        .gte('date', startDateStr)
        .lte('date', endDateStr),

      // Connected integrations
      db.from('integrations')
        .select('provider, status, last_sync_at')
        .eq('workspace_id', workspaceId)
        .eq('status', 'connected'),
    ]);

    // ── Aggregate GSC ──
    const gscRows = gscResult.data || [];
    const gscTotals = {
      clicks: 0,
      impressions: 0,
    };
    const gscDaily = new Map<string, { clicks: number; impressions: number }>();
    for (const row of gscRows) {
      gscTotals.clicks += row.clicks || 0;
      gscTotals.impressions += row.impressions || 0;
      const d = gscDaily.get(row.date) || { clicks: 0, impressions: 0 };
      d.clicks += row.clicks || 0;
      d.impressions += row.impressions || 0;
      gscDaily.set(row.date, d);
    }

    // ── Aggregate GA4 ──
    const ga4Rows = ga4Result.data || [];
    const ga4Totals = { sessions: 0, users: 0, pageviews: 0 };
    const ga4Daily = new Map<string, { sessions: number; users: number; pageviews: number }>();
    for (const row of ga4Rows) {
      if (row.dimension_name !== 'total' && row.dimension_name !== 'date') continue;
      const d = ga4Daily.get(row.date) || { sessions: 0, users: 0, pageviews: 0 };
      if (row.metric_type === 'sessions') { d.sessions += row.value; ga4Totals.sessions += row.value; }
      if (row.metric_type === 'totalUsers') { d.users += row.value; ga4Totals.users += row.value; }
      if (row.metric_type === 'screenPageViews') { d.pageviews += row.value; ga4Totals.pageviews += row.value; }
      ga4Daily.set(row.date, d);
    }
    // Fallback: aggregate from sessionSource if no total rows
    if (ga4Daily.size === 0) {
      for (const row of ga4Rows) {
        if (row.dimension_name !== 'sessionSource') continue;
        const d = ga4Daily.get(row.date) || { sessions: 0, users: 0, pageviews: 0 };
        if (row.metric_type === 'sessions') { d.sessions += row.value; ga4Totals.sessions += row.value; }
        if (row.metric_type === 'totalUsers') { d.users += row.value; ga4Totals.users += row.value; }
        if (row.metric_type === 'screenPageViews') { d.pageviews += row.value; ga4Totals.pageviews += row.value; }
        ga4Daily.set(row.date, d);
      }
    }

    // ── Aggregate Google Ads ──
    const gAdsRows = googleAdsResult.data || [];
    const gAdsTotals = { spend: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0 };
    const gAdsDaily = new Map<string, { spend: number; clicks: number }>();

    if (gAdsRows.length > 0) {
      for (const row of gAdsRows) {
        gAdsTotals.spend += Number(row.cost) || 0;
        gAdsTotals.clicks += Number(row.clicks) || 0;
        gAdsTotals.impressions += Number(row.impressions) || 0;
        gAdsTotals.conversions += Number(row.conversions) || 0;
        gAdsTotals.revenue += Number(row.conversions_value) || 0;
        if (row.date) {
          const d = gAdsDaily.get(row.date) || { spend: 0, clicks: 0 };
          d.spend += Number(row.cost) || 0;
          d.clicks += Number(row.clicks) || 0;
          gAdsDaily.set(row.date, d);
        }
      }
    } else {
      // Fallback: analytics_data JSONB
      const { data: fallback } = await db.from('analytics_data')
        .select('data')
        .eq('workspace_id', workspaceId)
        .eq('provider', 'google_ads')
        .order('synced_at', { ascending: false })
        .limit(1)
        .single();

      if (fallback?.data && Array.isArray(fallback.data)) {
        for (const c of fallback.data) {
          gAdsTotals.spend += Number(c.spend) || 0;
          gAdsTotals.clicks += Number(c.clicks) || 0;
          gAdsTotals.impressions += Number(c.impressions) || 0;
          gAdsTotals.conversions += Number(c.conversions) || 0;
          gAdsTotals.revenue += Number(c.conversions_value) || 0;
        }
      }
    }

    // ── Aggregate Meta Ads ──
    const metaRows = metaAdsResult.data || [];
    const metaTotals = { spend: 0, clicks: 0, impressions: 0, reach: 0, conversions: 0, revenue: 0 };
    const metaDaily = new Map<string, { spend: number; clicks: number }>();

    if (metaRows.length > 0) {
      for (const row of metaRows) {
        metaTotals.spend += Number(row.spend) || 0;
        metaTotals.clicks += Number(row.clicks) || 0;
        metaTotals.impressions += Number(row.impressions) || 0;
        metaTotals.reach += Number(row.reach) || 0;
        metaTotals.conversions += Number(row.conversions) || 0;
        metaTotals.revenue += Number(row.revenue) || 0;
        if (row.date) {
          const d = metaDaily.get(row.date) || { spend: 0, clicks: 0 };
          d.spend += Number(row.spend) || 0;
          d.clicks += Number(row.clicks) || 0;
          metaDaily.set(row.date, d);
        }
      }
    } else {
      // Fallback: analytics_data JSONB
      const { data: fallback } = await db.from('analytics_data')
        .select('data')
        .eq('workspace_id', workspaceId)
        .eq('provider', 'meta_ads')
        .order('synced_at', { ascending: false })
        .limit(1)
        .single();

      if (fallback?.data && Array.isArray(fallback.data)) {
        for (const c of fallback.data) {
          metaTotals.spend += Number(c.spend) || 0;
          metaTotals.clicks += Number(c.clicks) || 0;
          metaTotals.impressions += Number(c.impressions) || 0;
          metaTotals.reach += Number(c.reach) || 0;
          metaTotals.conversions += Number(c.conversions) || 0;
          metaTotals.revenue += Number(c.revenue) || 0;
        }
      }
    }

    // ── Combined metrics ──
    const totalAdSpend = gAdsTotals.spend + metaTotals.spend;
    const totalRevenue = gAdsTotals.revenue + metaTotals.revenue;
    const totalPaidClicks = gAdsTotals.clicks + metaTotals.clicks;
    const totalConversions = gAdsTotals.conversions + metaTotals.conversions;

    // ── Daily combined chart data ──
    const allDates = new Set<string>();
    gscDaily.forEach((_, d) => allDates.add(d));
    ga4Daily.forEach((_, d) => allDates.add(d));
    gAdsDaily.forEach((_, d) => allDates.add(d));
    metaDaily.forEach((_, d) => allDates.add(d));

    const daily = Array.from(allDates).sort().map(date => ({
      date,
      organic_clicks: gscDaily.get(date)?.clicks || 0,
      sessions: ga4Daily.get(date)?.sessions || 0,
      paid_clicks: (gAdsDaily.get(date)?.clicks || 0) + (metaDaily.get(date)?.clicks || 0),
      ad_spend: (gAdsDaily.get(date)?.spend || 0) + (metaDaily.get(date)?.spend || 0),
    }));

    // ── Integration status ──
    const connectedIntegrations = (integrationsResult.data || []).map((i: any) => ({
      provider: i.provider,
      last_sync_at: i.last_sync_at,
    }));

    return NextResponse.json({
      totals: {
        sessions: ga4Totals.sessions,
        users: ga4Totals.users,
        pageviews: ga4Totals.pageviews,
        organic_clicks: gscTotals.clicks,
        organic_impressions: gscTotals.impressions,
        ad_spend: totalAdSpend,
        ad_revenue: totalRevenue,
        paid_clicks: totalPaidClicks,
        conversions: totalConversions,
        roas: totalAdSpend > 0 ? +(totalRevenue / totalAdSpend).toFixed(2) : 0,
      },
      by_source: {
        gsc: gscTotals,
        ga4: ga4Totals,
        google_ads: gAdsTotals,
        meta_ads: metaTotals,
      },
      daily,
      integrations: connectedIntegrations,
      period: { start: startDateStr, end: endDateStr, days },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
