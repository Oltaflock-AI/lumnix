import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  const { workspace_id, name, facebook_page_name, domain } = await req.json();
  if (!workspace_id || !name) {
    return NextResponse.json({ error: 'workspace_id and name required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('competitor_brands')
    .insert({ workspace_id, name, facebook_page_name: facebook_page_name || null, domain: domain || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ competitor: data });
}
