import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/anomalies?workspace_id=xxx
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('anomalies')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('detected_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ anomalies: data || [] });
}
