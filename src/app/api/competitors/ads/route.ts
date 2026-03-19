import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspace_id = searchParams.get('workspace_id');
  const competitor_id = searchParams.get('competitor_id');
  const days = parseInt(searchParams.get('days') || '30');

  if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('competitor_ads')
    .select('*, competitor_brands(name)')
    .eq('workspace_id', workspace_id)
    .order('scraped_at', { ascending: false });

  if (competitor_id) {
    query = query.eq('competitor_id', competitor_id);
  }

  const since = new Date();
  since.setDate(since.getDate() - days);
  query = query.gte('scraped_at', since.toISOString());

  const { data: ads, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ads: ads || [] });
}
