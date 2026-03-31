import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/data/meta-ads?workspace_id=...&days=30
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

    const { data: rows } = await getSupabaseAdmin()
      .from('meta_ads_data')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: false });

    if (!rows || rows.length === 0) {
      // Fallback: check analytics_data table for campaign-level data (stored by sync)
      const { data: fallback } = await getSupabaseAdmin()
        .from('analytics_data')
        .select('data')
        .eq('workspace_id', workspaceId)
        .eq('provider', 'meta_ads')
        .eq('metric_type', 'campaigns')
        .order('synced_at', { ascending: false })
        .limit(1)
        .single();

      if (fallback?.data && Array.isArray(fallback.data) && fallback.data.length > 0) {
        const campaigns = fallback.data.map((c: any) => ({
          campaign_name: c.name || c.campaign_name || 'Unknown',
          status: c.status || 'UNKNOWN',
          objective: c.objective || '',
          budget: c.budget || 'N/A',
          spend: c.spend || '—',
          impressions: c.impressions || '0',
          clicks: c.clicks || '0',
          ctr: c.ctr || '0%',
          cpc: c.cpc || '—',
          roas: c.roas || '—',
          currency: c.currency || '',
        }));

        // Parse totals from the formatted campaign data
        const parseNum = (v: any) => {
          if (typeof v === 'number') return v;
          if (typeof v !== 'string') return 0;
          return parseFloat(v.replace(/[^0-9.-]/g, '')) || 0;
        };

        const totals = {
          spend: campaigns.reduce((s: number, c: any) => s + parseNum(c.spend), 0),
          clicks: campaigns.reduce((s: number, c: any) => s + parseNum(c.clicks), 0),
          impressions: campaigns.reduce((s: number, c: any) => s + parseNum(c.impressions), 0),
          reach: 0,
          conversions: 0,
          revenue: 0,
          roas: 0,
        };

        return NextResponse.json({ campaigns, totals, source: 'analytics_data' });
      }

      return NextResponse.json({ campaigns: [], totals: null, message: 'No data yet. Click Sync Now to pull your Meta Ads data.' });
    }

    // Aggregate by campaign
    const campaignMap = new Map<string, any>();
    for (const row of rows) {
      const key = row.campaign_id || row.campaign_name;
      const existing = campaignMap.get(key) || {
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        account_id: row.account_id,
        impressions: 0,
        clicks: 0,
        spend: 0,
        reach: 0,
        conversions: 0,
        revenue: 0,
      };
      existing.impressions += Number(row.impressions) || 0;
      existing.clicks += Number(row.clicks) || 0;
      existing.spend += Number(row.spend) || 0;
      existing.reach += Number(row.reach) || 0;
      existing.conversions += Number(row.conversions) || 0;
      existing.revenue += Number(row.revenue) || 0;
      campaignMap.set(key, existing);
    }

    const campaigns = Array.from(campaignMap.values()).map(c => ({
      ...c,
      ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
      cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
      roas: c.spend > 0 ? c.revenue / c.spend : 0,
    })).sort((a, b) => b.spend - a.spend);

    const totals = {
      spend: campaigns.reduce((s, c) => s + c.spend, 0),
      clicks: campaigns.reduce((s, c) => s + c.clicks, 0),
      impressions: campaigns.reduce((s, c) => s + c.impressions, 0),
      reach: campaigns.reduce((s, c) => s + c.reach, 0),
      conversions: campaigns.reduce((s, c) => s + c.conversions, 0),
      revenue: campaigns.reduce((s, c) => s + c.revenue, 0),
      roas: 0,
    };
    totals.roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

    // Build daily breakdown for charts
    const dailyMap = new Map<string, { date: string; spend: number; clicks: number; impressions: number; reach: number; conversions: number }>();
    for (const row of rows) {
      const date = row.date?.split('T')[0] || '';
      if (!date) continue;
      const existing = dailyMap.get(date) || { date, spend: 0, clicks: 0, impressions: 0, reach: 0, conversions: 0 };
      existing.spend += Number(row.spend) || 0;
      existing.clicks += Number(row.clicks) || 0;
      existing.impressions += Number(row.impressions) || 0;
      existing.reach += Number(row.reach) || 0;
      existing.conversions += Number(row.conversions) || 0;
      dailyMap.set(date, existing);
    }
    const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ campaigns, totals, daily });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
