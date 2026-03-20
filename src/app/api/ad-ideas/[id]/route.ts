import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { status, rating } = body;

  const supabase = getSupabaseAdmin();
  const update: any = {};
  if (status) update.status = status;
  if (rating !== undefined) update.rating = rating;

  const { data, error } = await supabase
    .from('ad_ideas')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ idea: data });
}
