import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

// POST /api/anomalies/[id]/read — marks anomaly as read
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Path params bypass the middleware workspace check. Resolve the anomaly's
  // workspace, then verify the caller belongs to it.
  const { data: anomaly } = await db
    .from('anomalies')
    .select('id, workspace_id')
    .eq('id', id)
    .single();
  if (!anomaly) {
    return NextResponse.json({ error: 'Anomaly not found' }, { status: 404 });
  }

  const access = await verifyWorkspaceAccess(req, anomaly.workspace_id);
  if (access instanceof NextResponse) return access;

  const { error } = await db
    .from('anomalies')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update anomaly' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
