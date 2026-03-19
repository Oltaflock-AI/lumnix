import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspace_id = searchParams.get('workspace_id');
  if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: competitors, error } = await supabase
    .from('competitor_brands')
    .select('*')
    .eq('workspace_id', workspace_id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const competitorIds = (competitors || []).map((c: any) => c.id);
  const adCounts: Record<string, number> = {};

  if (competitorIds.length > 0) {
    const { data: counts } = await supabase
      .from('competitor_ads')
      .select('competitor_id')
      .in('competitor_id', competitorIds);

    for (const row of counts || []) {
      adCounts[row.competitor_id] = (adCounts[row.competitor_id] || 0) + 1;
    }
  }

  const result = (competitors || []).map((c: any) => ({ ...c, ad_count: adCounts[c.id] || 0 }));
  return NextResponse.json({ competitors: result });
}
