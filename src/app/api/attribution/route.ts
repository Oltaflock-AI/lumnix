import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/attribution?workspace_id=...&days=30&model=last_click
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
  const model = req.nextUrl.searchParams.get('model') || 'last_click';

  if (!workspaceId) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });

  const db = getSupabaseAdmin();
  const dateFrom = new Date(Date.now() - days * 86400000).toISOString();

  // Get conversions
  const { data: conversions } = await db.from('attribution_conversions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('converted_at', dateFrom)
    .order('converted_at', { ascending: false })
    .limit(200);

  if (!conversions || conversions.length === 0) {
    // Return pixel stats even without conversions
    const { data: events } = await db.from('pixel_events')
      .select('event_type')
      .eq('workspace_id', workspaceId)
      .gte('created_at', dateFrom);

    const { data: touchpoints } = await db.from('attribution_touchpoints')
      .select('channel')
      .eq('workspace_id', workspaceId)
      .gte('touch_at', dateFrom);

    const pageviews = (events || []).filter(e => e.event_type === 'pageview').length;
    const uniqueVisitors = new Set((events || []).map((e: any) => e.visitor_id)).size;

    return NextResponse.json({
      conversions: [],
      by_channel: {},
      totals: { conversions: 0, revenue: 0, pageviews, uniqueVisitors, touchpoints: (touchpoints || []).length },
      model,
      period: `last ${days} days`,
      message: pageviews > 0 ? 'Tracking active but no conversions yet.' : 'No pixel data yet. Install lmnx.js on your site to start tracking.',
    });
  }

  // Aggregate by channel using the selected model
  const byChannel: Record<string, { conversions: number; revenue: number; touchpoints: number }> = {};

  for (const conv of conversions) {
    const attr = conv.attributed_to || {};
    let channels: { channel: string; weight: number }[] = [];

    if (model === 'first_click' && attr.first_click) {
      channels = [{ channel: attr.first_click.channel, weight: 1 }];
    } else if (model === 'last_click' && attr.last_click) {
      channels = [{ channel: attr.last_click.channel, weight: 1 }];
    } else if (model === 'linear' && attr.linear) {
      channels = attr.linear.map((t: any) => ({ channel: t.channel, weight: t.weight || 1 / attr.linear.length }));
    } else if (attr.last_click) {
      channels = [{ channel: attr.last_click.channel, weight: 1 }];
    }

    for (const ch of channels) {
      if (!byChannel[ch.channel]) byChannel[ch.channel] = { conversions: 0, revenue: 0, touchpoints: 0 };
      byChannel[ch.channel].conversions += ch.weight;
      byChannel[ch.channel].revenue += (conv.conversion_value || 0) * ch.weight;
    }
  }

  // Get touchpoint counts by channel
  const { data: touchpoints } = await db.from('attribution_touchpoints')
    .select('channel')
    .eq('workspace_id', workspaceId)
    .gte('touch_at', dateFrom);

  for (const tp of touchpoints || []) {
    if (!byChannel[tp.channel]) byChannel[tp.channel] = { conversions: 0, revenue: 0, touchpoints: 0 };
    byChannel[tp.channel].touchpoints++;
  }

  // Round values
  for (const ch of Object.values(byChannel)) {
    ch.conversions = +ch.conversions.toFixed(2);
    ch.revenue = +ch.revenue.toFixed(2);
  }

  const totalConversions = conversions.length;
  const totalRevenue = conversions.reduce((s, c) => s + (c.conversion_value || 0), 0);

  return NextResponse.json({
    conversions: conversions.slice(0, 50),
    by_channel: byChannel,
    totals: { conversions: totalConversions, revenue: +totalRevenue.toFixed(2) },
    model,
    period: `last ${days} days`,
  });
}
