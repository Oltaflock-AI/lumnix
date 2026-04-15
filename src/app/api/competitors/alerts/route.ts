import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

// Resolve the competitor's workspace and verify the caller is a member.
// Previously both handlers accepted only `competitor_id`, so any authed user
// could read or mark-seen alerts for any workspace's competitors by guessing
// the UUID. Scoped id needs an explicit ownership check.
async function guardCompetitor(req: NextRequest, competitorId: string) {
  const { data: competitor } = await getSupabaseAdmin()
    .from('competitor_brands')
    .select('id, workspace_id')
    .eq('id', competitorId)
    .single();
  if (!competitor) {
    return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
  }
  const access = await verifyWorkspaceAccess(req, competitor.workspace_id);
  if (access instanceof NextResponse) return access;
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const competitor_id = searchParams.get('competitor_id');
  const unread = searchParams.get('unread') === 'true';
  if (!competitor_id) return NextResponse.json({ error: 'competitor_id required' }, { status: 400 });

  const guard = await guardCompetitor(req, competitor_id);
  if (guard) return guard;

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('change_alerts')
    .select('*')
    .eq('competitor_id', competitor_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unread) query = query.is('seen_at', null);

  const { data: alerts } = await query;
  return NextResponse.json({ alerts: alerts ?? [] });
}

export async function POST(req: NextRequest) {
  const { competitor_id } = await req.json();
  if (!competitor_id) return NextResponse.json({ error: 'competitor_id required' }, { status: 400 });

  const guard = await guardCompetitor(req, competitor_id);
  if (guard) return guard;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('change_alerts')
    .update({ seen_at: new Date().toISOString() })
    .eq('competitor_id', competitor_id)
    .is('seen_at', null)
    .select('id');

  return NextResponse.json({ updated: data?.length ?? 0 });
}
