import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

type AttributionModel = 'first_touch' | 'last_touch' | 'linear';

interface ChannelBreakdown {
  channel: string;
  conversions: number;
  value: number;
  percentage: number;
}

function attributeConversions(
  touchpoints: Array<{ channel: string; touchpoints: string[]; conversion_value: number }>,
  model: AttributionModel
): ChannelBreakdown[] {
  const channelValues: Record<string, { value: number; conversions: number }> = {};

  for (const row of touchpoints) {
    const points = row.touchpoints || [];
    if (points.length === 0) continue;

    if (model === 'first_touch') {
      const ch = points[0];
      if (!channelValues[ch]) channelValues[ch] = { value: 0, conversions: 0 };
      channelValues[ch].value += row.conversion_value;
      channelValues[ch].conversions += 1;
    } else if (model === 'last_touch') {
      const ch = points[points.length - 1];
      if (!channelValues[ch]) channelValues[ch] = { value: 0, conversions: 0 };
      channelValues[ch].value += row.conversion_value;
      channelValues[ch].conversions += 1;
    } else {
      // linear: split credit equally
      const share = row.conversion_value / points.length;
      const convShare = 1 / points.length;
      for (const ch of points) {
        if (!channelValues[ch]) channelValues[ch] = { value: 0, conversions: 0 };
        channelValues[ch].value += share;
        channelValues[ch].conversions += convShare;
      }
    }
  }

  const totalValue = Object.values(channelValues).reduce((s, v) => s + v.value, 0);

  return Object.entries(channelValues)
    .map(([channel, data]) => ({
      channel,
      conversions: Math.round(data.conversions * 10) / 10,
      value: Math.round(data.value * 100) / 100,
      percentage: totalValue > 0 ? Math.round((data.value / totalValue) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Build attribution data from existing GA4 + GSC + Ads data.
 * Since we don't have real user-level touchpoint tracking,
 * we synthesize channel attribution from aggregated data.
 */
async function buildAttributionFromExistingData(
  db: ReturnType<typeof getSupabaseAdmin>,
  workspaceId: string,
  dateFrom: string,
  dateTo: string
) {
  const [ga4Res, gscRes, adsRes] = await Promise.allSettled([
    db.from('ga4_data')
      .select('metric_type, dimension_name, dimension_value, value, date')
      .eq('workspace_id', workspaceId)
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .in('metric_type', ['sessions', 'conversions'])
      .eq('dimension_name', 'sessionSource'),
    db.from('gsc_data')
      .select('clicks, date')
      .eq('workspace_id', workspaceId)
      .gte('date', dateFrom)
      .lte('date', dateTo),
    db.from('analytics_data')
      .select('provider, data, date_range_start')
      .eq('workspace_id', workspaceId)
      .gte('date_range_start', dateFrom)
      .lte('date_range_start', dateTo),
  ]);

  const ga4Rows = ga4Res.status === 'fulfilled' ? (ga4Res.value.data || []) : [];
  const gscRows = gscRes.status === 'fulfilled' ? (gscRes.value.data || []) : [];
  const adsRows = adsRes.status === 'fulfilled' ? (adsRes.value.data || []) : [];

  // Aggregate by channel
  const channels: Record<string, { sessions: number; conversions: number; value: number }> = {};

  // GA4 sources → channels
  for (const row of ga4Rows) {
    const source = row.dimension_value || 'direct';
    const channel = mapSourceToChannel(source);
    if (!channels[channel]) channels[channel] = { sessions: 0, conversions: 0, value: 0 };
    if (row.metric_type === 'sessions') channels[channel].sessions += (row.value || 0);
    if (row.metric_type === 'conversions') channels[channel].conversions += (row.value || 0);
  }

  // GSC clicks → organic search
  const totalClicks = gscRows.reduce((s: number, r: any) => s + (r.clicks || 0), 0);
  if (totalClicks > 0) {
    if (!channels['Organic Search']) channels['Organic Search'] = { sessions: 0, conversions: 0, value: 0 };
    channels['Organic Search'].sessions += totalClicks;
  }

  // Ads data → paid channels
  for (const row of adsRows) {
    const channel = row.provider === 'google_ads' ? 'Google Ads' : 'Meta Ads';
    if (!channels[channel]) channels[channel] = { sessions: 0, conversions: 0, value: 0 };
    const data = row.data as any;
    if (data?.clicks) channels[channel].sessions += data.clicks;
    if (data?.conversions) channels[channel].conversions += data.conversions;
    if (data?.conversion_value) channels[channel].value += data.conversion_value;
  }

  return channels;
}

function mapSourceToChannel(source: string): string {
  const s = source.toLowerCase();
  if (s === 'google' || s === 'bing' || s === 'yahoo' || s === 'duckduckgo') return 'Organic Search';
  if (s === 'direct' || s === '(direct)' || s === '(none)') return 'Direct';
  if (s.includes('facebook') || s.includes('instagram') || s.includes('twitter') || s.includes('linkedin') || s.includes('tiktok')) return 'Social';
  if (s.includes('email') || s.includes('newsletter') || s.includes('mailchimp')) return 'Email';
  if (s.includes('cpc') || s.includes('paid') || s.includes('ads')) return 'Paid Search';
  return 'Referral';
}

// GET /api/data/attribution?workspace_id=xxx&model=linear&from=2026-03-01&to=2026-04-01
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });

  const auth = await verifyWorkspaceAccess(req, workspaceId);
  if (auth instanceof NextResponse) return auth;

  const model = (req.nextUrl.searchParams.get('model') || 'last_touch') as AttributionModel;
  const now = new Date();
  const dateFrom = req.nextUrl.searchParams.get('from') || new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const dateTo = req.nextUrl.searchParams.get('to') || now.toISOString().slice(0, 10);

  const db = getSupabaseAdmin();

  // First check for explicit attribution_data entries
  const { data: attrData } = await db
    .from('attribution_data')
    .select('channel, touchpoints, conversion_value')
    .eq('workspace_id', workspaceId)
    .gte('converted_at', `${dateFrom}T00:00:00Z`)
    .lte('converted_at', `${dateTo}T23:59:59Z`);

  let breakdown: ChannelBreakdown[];

  if (attrData && attrData.length > 0) {
    // Use real attribution data
    breakdown = attributeConversions(attrData, model);
  } else {
    // Synthesize from existing platform data
    const channels = await buildAttributionFromExistingData(db, workspaceId, dateFrom, dateTo);
    const totalSessions = Object.values(channels).reduce((s, c) => s + c.sessions, 0);

    breakdown = Object.entries(channels)
      .filter(([, data]) => data.sessions > 0)
      .map(([channel, data]) => ({
        channel,
        conversions: data.conversions,
        value: data.value,
        percentage: totalSessions > 0 ? Math.round((data.sessions / totalSessions) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }

  const totalConversions = breakdown.reduce((s, b) => s + b.conversions, 0);
  const totalValue = breakdown.reduce((s, b) => s + b.value, 0);

  return NextResponse.json({
    model,
    breakdown,
    totalConversions: Math.round(totalConversions * 10) / 10,
    totalValue: Math.round(totalValue * 100) / 100,
    dataPoints: attrData?.length || 0,
    dateRange: { from: dateFrom, to: dateTo },
    synthesized: !attrData || attrData.length === 0,
  });
}
