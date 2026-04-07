import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/briefings?workspace_id=...
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from('daily_briefings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('briefing_date', { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ briefings: data || [] });
}
