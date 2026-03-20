import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const competitor_id = searchParams.get('competitor_id');
  const unread = searchParams.get('unread') === 'true';
  if (!competitor_id) return NextResponse.json({ error: 'competitor_id required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('change_alerts')
    .select('*')
    .eq('competitor_id', competitor_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unread) query = query.is('seen_at', null);

  const { data: alerts } = await query;
  return NextResponse.json({ alerts: alerts ?? [] });
}

export async function POST(req: NextRequest) {
  const { competitor_id } = await req.json();
  if (!competitor_id) return NextResponse.json({ error: 'competitor_id required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('change_alerts')
    .update({ seen_at: new Date().toISOString() })
    .eq('competitor_id', competitor_id)
    .is('seen_at', null)
    .select('id');

  return NextResponse.json({ updated: data?.length ?? 0 });
}
