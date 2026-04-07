import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/share/[token] — public endpoint for shared dashboards
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const db = getSupabaseAdmin();

    const { data: dashboard } = await db.from('shared_dashboards')
      .select('*')
      .eq('share_token', token)
      .eq('is_active', true)
      .single();

    if (!dashboard) return NextResponse.json({ error: 'Dashboard not found or inactive' }, { status: 404 });
    if (dashboard.expires_at && new Date(dashboard.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This shared dashboard has expired' }, { status: 410 });
    }

    // Increment view count
    await db.from('shared_dashboards').update({ views: (dashboard.views || 0) + 1 }).eq('id', dashboard.id);

    const workspaceId = dashboard.workspace_id;
    const days = 30;
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

    // Fetch unified data
    const [wsRes, gscRes, ga4Res, gAdsRes, metaRes] = await Promise.all([
      db.from('workspaces').select('name, brand_color, logo_url').eq('id', workspaceId).single(),
      db.from('gsc_data').select('date, clicks, impressions').eq('workspace_id', workspaceId).gte('date', startDate),
      db.from('ga4_data').select('date, metric_type, dimension_name, value').eq('workspace_id', workspaceId).gte('date', startDate),
      db.from('google_ads_data').select('date, clicks, cost, conversions, conversions_value').eq('workspace_id', workspaceId).gte('date', startDate),
      db.from('meta_ads_data').select('date, clicks, spend, conversions, revenue').eq('workspace_id', workspaceId).gte('date', startDate),
    ]);

    const ws = wsRes.data;
    const gscRows = gscRes.data || [];
    const ga4Rows = ga4Res.data || [];
    const gAdsRows = gAdsRes.data || [];
    const metaRows = metaRes.data || [];

    const organicClicks = gscRows.reduce((s, r) => s + (r.clicks || 0), 0);
    const sessions = ga4Rows.filter(r => r.metric_type === 'sessions' && (r.dimension_name === 'total' || r.dimension_name === 'date')).reduce((s, r) => s + (r.value || 0), 0)
      || ga4Rows.filter(r => r.metric_type === 'sessions' && r.dimension_name === 'sessionSource').reduce((s, r) => s + (r.value || 0), 0);
    const adSpend = gAdsRows.reduce((s, r) => s + Number(r.cost || 0), 0) + metaRows.reduce((s, r) => s + Number(r.spend || 0), 0);
    const adRevenue = gAdsRows.reduce((s, r) => s + Number(r.conversions_value || 0), 0) + metaRows.reduce((s, r) => s + Number(r.revenue || 0), 0);

    // Build daily chart data
    const dailyMap = new Map<string, { organic_clicks: number; paid_clicks: number }>();
    for (const r of gscRows) { const d = dailyMap.get(r.date) || { organic_clicks: 0, paid_clicks: 0 }; d.organic_clicks += r.clicks || 0; dailyMap.set(r.date, d); }
    for (const r of gAdsRows) { if (!r.date) continue; const d = dailyMap.get(r.date) || { organic_clicks: 0, paid_clicks: 0 }; d.paid_clicks += Number(r.clicks || 0); dailyMap.set(r.date, d); }
    for (const r of metaRows) { if (!r.date) continue; const d = dailyMap.get(r.date) || { organic_clicks: 0, paid_clicks: 0 }; d.paid_clicks += Number(r.clicks || 0); dailyMap.set(r.date, d); }
    const daily = Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      title: dashboard.title,
      workspace_name: ws?.name || 'Workspace',
      logo_url: dashboard.custom_logo_url || ws?.logo_url,
      brand_color: dashboard.custom_brand_color || ws?.brand_color || '#7C3AED',
      period: `Last ${days} days`,
      totals: {
        sessions,
        organic_clicks: organicClicks,
        ad_spend: +adSpend.toFixed(2),
        ad_revenue: +adRevenue.toFixed(2),
        roas: adSpend > 0 ? +(adRevenue / adSpend).toFixed(2) : 0,
      },
      daily,
      sections: dashboard.sections,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
