import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'competitor id required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Delete related data first (ads, briefs, analysis, ideas, alerts)
  await supabase.from('competitor_ads').delete().eq('competitor_id', id);
  await supabase.from('competitor_briefs').delete().eq('competitor_id', id);
  await supabase.from('ai_analysis').delete().eq('competitor_id', id);
  await supabase.from('ad_ideas').delete().eq('competitor_id', id);
  await supabase.from('change_alerts').delete().eq('competitor_id', id);

  // Delete the competitor brand itself
  const { error } = await supabase
    .from('competitor_brands')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
