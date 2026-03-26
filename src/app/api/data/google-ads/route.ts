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

    const { data: rows } = await getSupabaseAdmin()
      .from('google_ads_data')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: false });

    if (!rows || rows.length === 0) {
      return NextResponse.json({ campaigns: [], totals: null, message: 'No data yet. Sync your Google Ads integration first.' });
    }

    // Aggregate by campaign
    const campaignMap = new Map<string, any>();
    for (const row of rows) {
      const key = row.campaign_id || row.campaign_name;
      const existing = campaignMap.get(key) || {
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        status: row.status,
        customer_id: row.customer_id,
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversions_value: 0,
      };
      existing.impressions += Number(row.impressions) || 0;
      existing.clicks += Number(row.clicks) || 0;
      existing.cost += Number(row.cost) || 0;
      existing.conversions += Number(row.conversions) || 0;
      existing.conversions_value += Number(row.conversions_value) || 0;
      campaignMap.set(key, existing);
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
    };
    totals.roas = totals.spend > 0 ? totals.conversions_value / totals.spend : 0;
    totals.avg_cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;

    return NextResponse.json({ campaigns, totals });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
