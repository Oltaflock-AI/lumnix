import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/creative/saves?workspace_id=...&board_id=...&search=...&tags=...
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  const boardId = req.nextUrl.searchParams.get('board_id');
  const search = req.nextUrl.searchParams.get('search');
  const tags = req.nextUrl.searchParams.get('tags'); // comma-separated

  if (!workspaceId) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });

  let query = getSupabaseAdmin()
    .from('creative_saves')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (boardId) query = query.eq('board_id', boardId);
  if (search) query = query.or(`title.ilike.%${search}%,ad_copy.ilike.%${search}%,advertiser_name.ilike.%${search}%`);
  if (tags) {
    const tagList = tags.split(',').map(t => t.trim());
    query = query.overlaps('tags', tagList);
  }

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saves: data || [] });
}

// POST /api/creative/saves — save an ad to a board
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspace_id, board_id, source_type, source_id, title, image_url, video_url,
            landing_page_url, ad_copy, cta, advertiser_name, platform,
            started_running, tags, notes, metadata } = body;

    if (!workspace_id || !source_type) {
      return NextResponse.json({ error: 'workspace_id and source_type required' }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from('creative_saves')
      .insert({
        workspace_id, board_id: board_id || null, source_type, source_id,
        title, image_url, video_url, landing_page_url, ad_copy, cta,
        advertiser_name, platform, started_running,
        tags: tags || [], notes, metadata: metadata || {},
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ save: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/creative/saves?id=...
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await getSupabaseAdmin().from('creative_saves').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
