import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

function getUserClient(authHeader: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    { global: { headers: { Authorization: authHeader } } }
  );
}

// DELETE /api/workspace/[id] — delete a workspace (owner only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'workspace id required' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getUserClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    // Verify the user is the owner of this workspace
    const { data: workspace } = await admin
      .from('workspaces')
      .select('id, owner_id')
      .eq('id', id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the workspace owner can delete it' }, { status: 403 });
    }

    // Prevent deleting the last workspace — user must always have at least one
    const { data: userWorkspaces } = await admin
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id);

    if ((userWorkspaces?.length || 0) <= 1) {
      return NextResponse.json({ error: 'Cannot delete your only workspace' }, { status: 400 });
    }

    // Delete the workspace — cascades to workspace_members, integrations, etc. via FK
    const { error: delErr } = await admin
      .from('workspaces')
      .delete()
      .eq('id', id);

    if (delErr) {
      return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    console.error('DELETE /api/workspace/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
