import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'competitor id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Path params bypass the middleware workspace check. Resolve the competitor's
  // workspace and verify the caller belongs to it before cascade-deleting.
  const { data: competitor } = await supabase
    .from('competitor_brands')
    .select('id, workspace_id')
    .eq('id', id)
    .single();
  if (!competitor) {
    return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
  }

  const access = await verifyWorkspaceAccess(req, competitor.workspace_id);
  if (access instanceof NextResponse) return access;

  // Delete related data first (ads, briefs, analysis, ideas, alerts)
  await supabase.from('competitor_ads').delete().eq('competitor_id', id);
  await supabase.from('competitor_briefs').delete().eq('competitor_id', id);
  await supabase.from('ai_analysis').delete().eq('competitor_id', id);
  await supabase.from('ad_ideas').delete().eq('competitor_id', id);
  await supabase.from('change_alerts').delete().eq('competitor_id', id);

  // Delete the competitor brand itself
  const { error } = await supabase
    .from('competitor_brands')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete competitor' }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
