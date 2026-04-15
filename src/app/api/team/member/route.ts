import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

function getUserClient(authHeader: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

// PATCH /api/team/member — update a member's role
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getUserClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace_id, member_id, role } = await req.json();
    if (!workspace_id || !member_id || !role) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    if (!['admin', 'member', 'viewer'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

    const db = getSupabaseAdmin();

    // Verify requester is owner
    const { data: ws } = await db.from('workspaces').select('owner_id').eq('id', workspace_id).single();
    if (!ws || ws.owner_id !== user.id) return NextResponse.json({ error: 'Only workspace owner can change roles' }, { status: 403 });

    // Can't change own role
    const { data: member } = await db.from('workspace_members').select('user_id').eq('id', member_id).single();
    if (member?.user_id === user.id) return NextResponse.json({ error: "Can't change your own role" }, { status: 400 });

    await db.from('workspace_members').update({ role }).eq('id', member_id).eq('workspace_id', workspace_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/team/member — remove a member from workspace
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getUserClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const memberId = req.nextUrl.searchParams.get('member_id');
    const workspaceId = req.nextUrl.searchParams.get('workspace_id');
    if (!memberId || !workspaceId) return NextResponse.json({ error: 'Missing member_id or workspace_id' }, { status: 400 });

    const db = getSupabaseAdmin();

    // Verify requester is owner
    const { data: ws } = await db.from('workspaces').select('owner_id').eq('id', workspaceId).single();
    if (!ws || ws.owner_id !== user.id) return NextResponse.json({ error: 'Only workspace owner can remove members' }, { status: 403 });

    // Can't remove self
    const { data: member } = await db.from('workspace_members').select('user_id').eq('id', memberId).single();
    if (member?.user_id === user.id) return NextResponse.json({ error: "Can't remove yourself" }, { status: 400 });

    await db.from('workspace_members').delete().eq('id', memberId).eq('workspace_id', workspaceId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
