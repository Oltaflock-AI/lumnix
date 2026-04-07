import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/shared?workspace_id=... — list shared dashboards
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from('shared_dashboards')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ dashboards: data || [] });
}

// POST /api/shared — create a shared dashboard link
export async function POST(req: NextRequest) {
  try {
    const { workspace_id, title, sections, custom_logo_url, custom_brand_color, expires_at } = await req.json();
    if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });

    const { data, error } = await getSupabaseAdmin()
      .from('shared_dashboards')
      .insert({
        workspace_id,
        title: title || 'Client Dashboard',
        sections: sections || ['overview', 'seo', 'analytics', 'ads'],
        custom_logo_url, custom_brand_color,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumnix-ai.vercel.app';
    return NextResponse.json({ dashboard: data, share_url: `${appUrl}/share/${data.share_token}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/shared?id=...
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await getSupabaseAdmin().from('shared_dashboards').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
