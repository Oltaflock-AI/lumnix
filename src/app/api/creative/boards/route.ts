import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/creative/boards?workspace_id=...
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from('creative_boards')
    .select('*, creative_saves(count)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ boards: data || [] });
}

// POST /api/creative/boards — create a board
export async function POST(req: NextRequest) {
  try {
    const { workspace_id, name, description, color } = await req.json();
    if (!workspace_id || !name?.trim()) {
      return NextResponse.json({ error: 'workspace_id and name required' }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from('creative_boards')
      .insert({ workspace_id, name: name.trim(), description: description?.trim() || null, color: color || '#7C3AED' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ board: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/creative/boards — delete a board
export async function DELETE(req: NextRequest) {
  const boardId = req.nextUrl.searchParams.get('id');
  if (!boardId) return NextResponse.json({ error: 'Missing board id' }, { status: 400 });

  const { error } = await getSupabaseAdmin().from('creative_boards').delete().eq('id', boardId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
