import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('ai_insights')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const lastGenerated = data && data.length > 0 ? data[0].created_at : null;

  return NextResponse.json({ insights: data || [], last_generated: lastGenerated });
}
