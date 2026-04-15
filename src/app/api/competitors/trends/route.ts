import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

// GET /api/competitors/trends?workspace_id=xxx&competitor_id=yyy&days=30
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  const competitorId = req.nextUrl.searchParams.get('competitor_id');
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30');

  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });

  const db = getSupabaseAdmin();
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  let query = db
    .from('competitor_ad_trends')
    .select('*, competitor_brands(name)')
    .gte('snapshot_date', since)
    .order('snapshot_date', { ascending: true });

  if (competitorId) {
    query = query.eq('competitor_id', competitorId);
  } else {
    // Filter by workspace through competitor_brands
    const { data: competitors } = await db
      .from('competitor_brands')
      .select('id')
      .eq('workspace_id', workspaceId);

    if (!competitors || competitors.length === 0) {
      return NextResponse.json({ trends: [] });
    }
    query = query.in('competitor_id', competitors.map(c => c.id));
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ trends: data || [] });
}

// POST /api/competitors/trends — snapshot current state (called by spy-agent cron)
export async function POST(req: NextRequest) {
  const { competitor_id } = await req.json();
  if (!competitor_id) return NextResponse.json({ error: 'competitor_id required' }, { status: 400 });

  const db = getSupabaseAdmin();

  // Resolve the competitor's workspace and verify membership. Without this
  // any authed user could upsert trend snapshots on another workspace's
  // competitor_id, poisoning their reporting.
  const { data: competitor } = await db
    .from('competitor_brands')
    .select('id, workspace_id')
    .eq('id', competitor_id)
    .single();
  if (!competitor) {
    return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
  }
  const access = await verifyWorkspaceAccess(req, competitor.workspace_id);
  if (access instanceof NextResponse) return access;

  const today = new Date().toISOString().slice(0, 10);

  // Get current ad stats
  const { data: ads } = await db
    .from('competitor_ads')
    .select('is_active, platforms, impressions_lower, impressions_upper')
    .eq('competitor_id', competitor_id);

  if (!ads) return NextResponse.json({ error: 'No ads data' }, { status: 400 });

  const totalAds = ads.length;
  const activeAds = ads.filter(a => a.is_active).length;

  // Estimate spend from impression ranges (rough CPM-based estimate)
  const CPM_ESTIMATE = 8; // $8 per 1000 impressions average
  const totalImpressionsLower = ads.reduce((s, a) => s + (a.impressions_lower || 0), 0);
  const totalImpressionsUpper = ads.reduce((s, a) => s + (a.impressions_upper || 0), 0);
  const estimatedSpendLower = Math.round((totalImpressionsLower / 1000) * CPM_ESTIMATE);
  const estimatedSpendUpper = Math.round((totalImpressionsUpper / 1000) * CPM_ESTIMATE);

  // Platform breakdown
  const platformCounts: Record<string, number> = {};
  for (const ad of ads) {
    for (const p of ad.platforms || []) {
      platformCounts[p] = (platformCounts[p] || 0) + 1;
    }
  }
  const topPlatforms = Object.entries(platformCounts)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);

  // Count new ads today
  const { count: newToday } = await db
    .from('change_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('competitor_id', competitor_id)
    .eq('change_type', 'new_ad')
    .gte('created_at', `${today}T00:00:00Z`);

  const { count: pausedToday } = await db
    .from('change_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('competitor_id', competitor_id)
    .eq('change_type', 'paused')
    .gte('created_at', `${today}T00:00:00Z`);

  // Upsert trend snapshot
  const { error } = await db
    .from('competitor_ad_trends')
    .upsert({
      competitor_id,
      snapshot_date: today,
      total_ads: totalAds,
      active_ads: activeAds,
      new_ads_today: newToday || 0,
      paused_today: pausedToday || 0,
      estimated_spend_lower: estimatedSpendLower,
      estimated_spend_upper: estimatedSpendUpper,
      top_platforms: topPlatforms,
    }, { onConflict: 'competitor_id,snapshot_date' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    snapshot_date: today,
    total_ads: totalAds,
    active_ads: activeAds,
    estimated_spend: `₹${estimatedSpendLower.toLocaleString()} - ₹${estimatedSpendUpper.toLocaleString()}`,
  });
}
