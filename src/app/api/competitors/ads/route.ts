import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspace_id = searchParams.get('workspace_id');
  const competitor_id = searchParams.get('competitor_id');
  const filter = searchParams.get('filter'); // 'all' | 'winning' | 'top_performer'
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;

  if (!workspace_id || !competitor_id) {
    return NextResponse.json({ error: 'workspace_id and competitor_id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('competitor_ads')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspace_id)
    .eq('competitor_id', competitor_id)
    .order('days_running', { ascending: false });

  // Filter by performance tier
  if (filter === 'winning') {
    query = query.in('performance_tier', ['winning', 'top_performer']);
  } else if (filter === 'top_performer') {
    query = query.eq('performance_tier', 'top_performer');
  }

  // Pagination
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data: ads, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ads: ads || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
