import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

const VALID_STATUS = new Set(['suggested', 'approved', 'rejected', 'shipped']);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const body = await req.json();
  const { status, rating } = body;

  const supabase = getSupabaseAdmin();

  // Resolve the ad_idea's workspace, then verify membership. Path params never
  // reach the middleware workspace check, so enforcement has to happen here.
  const { data: idea } = await supabase
    .from('ad_ideas')
    .select('id, workspace_id')
    .eq('id', id)
    .single();
  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  const access = await verifyWorkspaceAccess(req, idea.workspace_id);
  if (access instanceof NextResponse) return access;

  const update: Record<string, unknown> = {};
  if (status) {
    if (!VALID_STATUS.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    update.status = status;
  }
  if (rating !== undefined) {
    const n = Number(rating);
    if (!Number.isFinite(n) || n < 0 || n > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }
    update.rating = n;
  }

  const { data, error } = await supabase
    .from('ad_ideas')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 });
  return NextResponse.json({ idea: data });
}
