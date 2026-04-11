import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/data/google-ads?workspace_id=...&days=30
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

    // Primary source: google_ads_data table (one row per campaign per day).
    // Postgres filters by date on the query itself.
    const { data: rows } = await db
      .from('google_ads_data')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: false });

    if (rows && rows.length > 0) {
      return NextResponse.json(buildResponse(rows, 'google_ads_data', startDateStr, endDateStr));
    }

    // Fallback: analytics_data — the cron sync writes campaigns as a JSON blob
    // containing per-campaign-per-day rows (each with a `date` field).
    // We fetch the full blob and filter in-memory since it's already a flat array.
    const { data: fallback } = await db
      .from('analytics_data')
      .select('data, date_range_start, date_range_end, synced_at')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'google_ads')
      .eq('metric_type', 'campaigns')
      .order('synced_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallback?.data && Array.isArray(fallback.data) && fallback.data.length > 0) {
      return NextResponse.json(buildResponse(fallback.data, 'analytics_data', startDateStr, endDateStr));
    }

    return NextResponse.json({
      campaigns: [],
      totals: null,
      daily: [],
      currency: 'INR',
      message: 'No data yet. Click Sync Now to pull your Google Ads data.',
    });
  } catch (error) {
    console.error('google-ads route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildResponse(rows: any[], source: string, startDateStr: string, endDateStr: string) {
  // Filter rows by date range. google_ads_data is already filtered by Postgres,
  // but analytics_data is a JSON blob — every row has a `date` field, so we
  // apply the same window here. Rows without a date are dropped from filtering
  // (they can't be attributed to a day).
  const filtered = rows.filter(r => {
    const d = (r.date || '').split('T')[0];
    if (!d) return false;
    return d >= startDateStr && d <= endDateStr;
  });

  // Aggregate by campaign
  const campaignMap = new Map<string, any>();
  for (const row of filtered) {
    // Handle both google_ads_data (campaign_id/campaign_name/cost) and analytics_data JSON (id/name/spend)
    const campaignId = row.campaign_id || row.id || row.campaign_name || row.name || 'unknown';
    const campaignName = row.campaign_name || row.name || 'Unknown';
    const cost = Number(row.cost ?? row.spend ?? 0);

    const existing = campaignMap.get(campaignId) || {
      campaign_id: campaignId,
      campaign_name: campaignName,
      status: row.status || 'UNKNOWN',
      customer_id: row.customer_id || null,
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      conversions_value: 0,
    };
    existing.impressions += Number(row.impressions) || 0;
    existing.clicks += Number(row.clicks) || 0;
    existing.cost += cost;
    existing.conversions += Number(row.conversions) || 0;
    existing.conversions_value += Number(row.conversions_value ?? row.conversionsValue ?? 0);
    campaignMap.set(campaignId, existing);
  }

  const campaigns = Array.from(campaignMap.values()).map(c => ({
    ...c,
    ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
    avg_cpc: c.clicks > 0 ? c.cost / c.clicks : 0,
    roas: c.cost > 0 ? c.conversions_value / c.cost : 0,
  })).sort((a, b) => b.cost - a.cost);

  const totals = {
    spend: campaigns.reduce((s, c) => s + c.cost, 0),
    clicks: campaigns.reduce((s, c) => s + c.clicks, 0),
    impressions: campaigns.reduce((s, c) => s + c.impressions, 0),
    conversions: campaigns.reduce((s, c) => s + c.conversions, 0),
    conversions_value: campaigns.reduce((s, c) => s + c.conversions_value, 0),
    roas: 0,
    avg_cpc: 0,
    ctr: 0,
  };
  totals.roas = totals.spend > 0 ? totals.conversions_value / totals.spend : 0;
  totals.avg_cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  // Build daily breakdown for charts
  const dailyMap = new Map<string, { date: string; spend: number; clicks: number; impressions: number; conversions: number }>();
  for (const row of filtered) {
    const date = (row.date || '').split('T')[0];
    if (!date) continue;
    const cost = Number(row.cost ?? row.spend ?? 0);
    const existing = dailyMap.get(date) || { date, spend: 0, clicks: 0, impressions: 0, conversions: 0 };
    existing.spend += cost;
    existing.clicks += Number(row.clicks) || 0;
    existing.impressions += Number(row.impressions) || 0;
    existing.conversions += Number(row.conversions) || 0;
    dailyMap.set(date, existing);
  }
  const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    campaigns,
    totals,
    daily,
    source,
    currency: 'INR',
    date_range: { start: startDateStr, end: endDateStr, days_of_data: daily.length },
  };
}
