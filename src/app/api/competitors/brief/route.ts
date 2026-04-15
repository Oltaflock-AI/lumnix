import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspace_id = searchParams.get('workspace_id');
  const competitor_id = searchParams.get('competitor_id');

  if (!workspace_id || !competitor_id) {
    return NextResponse.json({ error: 'workspace_id and competitor_id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: brief, error } = await supabase
    .from('competitor_briefs')
    .select('*')
    .eq('workspace_id', workspace_id)
    .eq('competitor_id', competitor_id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ brief: brief || null });
}
