import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const competitor_id = searchParams.get('competitor_id');
  if (!competitor_id) return NextResponse.json({ error: 'competitor_id required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: analysis } = await supabase
    .from('ai_analysis')
    .select('*')
    .eq('competitor_id', competitor_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: ideas } = await supabase
    .from('ad_ideas')
    .select('*')
    .eq('competitor_id', competitor_id)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    analysis: analysis ?? null,
    ideas: ideas ?? [],
    lastAnalysedAt: analysis?.created_at ?? null,
  });
}
