import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// POST /api/pixel/collect — receives events from lmnx.js pixel
// Also supports GET for simple pageview tracking via image pixel
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspace_id, visitor_id, session_id, event_type, page_url, referrer,
            utm_source, utm_medium, utm_campaign, utm_content, utm_term,
            device_type, browser, country, conversion_type, conversion_value, metadata } = body;

    if (!workspace_id || !visitor_id || !event_type) {
      return NextResponse.json({ error: 'workspace_id, visitor_id, event_type required' }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Insert pixel event
    await db.from('pixel_events').insert({
      workspace_id, visitor_id, session_id,
      event_type, page_url, referrer,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      device_type, browser, country,
      conversion_type, conversion_value,
      metadata: metadata || {},
    });

    // If this has UTM params or referrer, also create an attribution touchpoint
    if (utm_source || referrer) {
      const channel = utm_medium === 'cpc' || utm_medium === 'paid' ? (utm_source?.includes('google') ? 'paid_google' : 'paid_meta')
        : utm_medium === 'email' ? 'email'
        : utm_source ? 'referral'
        : referrer ? 'referral'
        : 'direct';

      await db.from('attribution_touchpoints').insert({
        workspace_id, visitor_id, channel,
        campaign_id: utm_campaign || null,
        source: utm_source || null,
        medium: utm_medium || null,
        page_url,
      });
    }

    // If this is a conversion, create attribution record
    if (event_type === 'conversion' && conversion_type) {
      // Get all touchpoints for this visitor
      const { data: touchpoints } = await db.from('attribution_touchpoints')
        .select('*')
        .eq('workspace_id', workspace_id)
        .eq('visitor_id', visitor_id)
        .order('touch_at', { ascending: true });

      const tps = touchpoints || [];
      const firstTouch = tps[0];
      const lastTouch = tps[tps.length - 1];

      const attributed_to: any = {};
      if (firstTouch) attributed_to.first_click = { channel: firstTouch.channel, campaign_id: firstTouch.campaign_id, source: firstTouch.source };
      if (lastTouch) attributed_to.last_click = { channel: lastTouch.channel, campaign_id: lastTouch.campaign_id, source: lastTouch.source };
      if (tps.length > 0) {
        attributed_to.linear = tps.map(t => ({ channel: t.channel, campaign_id: t.campaign_id, source: t.source, weight: +(1 / tps.length).toFixed(4) }));
      }

      await db.from('attribution_conversions').insert({
        workspace_id, visitor_id,
        conversion_type,
        conversion_value: conversion_value || 0,
        attributed_to,
        model: 'multi',
        touchpoint_count: tps.length,
      });
    }

    // Return with CORS headers for cross-origin pixel requests
    return NextResponse.json({ ok: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
