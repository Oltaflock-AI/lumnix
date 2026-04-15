import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const competitor_id = searchParams.get('competitor_id');
  if (!competitor_id) return NextResponse.json({ error: 'competitor_id required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Resolve the competitor's workspace and verify caller membership.
  // Previously this returned AI analysis + ad ideas for any competitor_id,
  // leaking another workspace's creative strategy data.
  const { data: competitor } = await supabase
    .from('competitor_brands')
    .select('id, workspace_id')
    .eq('id', competitor_id)
    .single();
  if (!competitor) {
    return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
  }
  const access = await verifyWorkspaceAccess(req, competitor.workspace_id);
  if (access instanceof NextResponse) return access;

  const { data: analysis } = await supabase
    .from('ai_analysis')
    .select('*')
    .eq('competitor_id', competitor_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: ideas } = await supabase
    .from('ad_ideas')
    .select('*')
    .eq('competitor_id', competitor_id)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    analysis: analysis ?? null,
    ideas: ideas ?? [],
    lastAnalysedAt: analysis?.created_at ?? null,
  });
}
