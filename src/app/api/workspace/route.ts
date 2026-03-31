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

// GET /api/workspace — get current user's workspace (supports ?workspace_id= for switching)
export async function GET(req: NextRequest) {
  try {
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
    const requestedId = req.nextUrl.searchParams.get('workspace_id');

    // Get ALL workspaces for this user
    const { data: memberships } = await admin
      .from('workspace_members')
      .select('workspace_id, role, workspaces(id, name, plan, logo_url, brand_color, slug, owner_id)')
      .eq('user_id', user.id);

    // Also check owned workspaces not in workspace_members
    const { data: ownedWorkspaces } = await admin
      .from('workspaces')
      .select('id, name, plan, logo_url, brand_color, slug, owner_id')
      .eq('owner_id', user.id);

    // Build complete list of workspaces
    const wsMap = new Map<string, { workspace: any; role: string }>();
    for (const m of memberships || []) {
      if (m.workspaces) {
        wsMap.set((m.workspaces as any).id, { workspace: m.workspaces, role: m.role });
      }
    }
    for (const ow of ownedWorkspaces || []) {
      if (!wsMap.has(ow.id)) {
        wsMap.set(ow.id, { workspace: ow, role: 'owner' });
        // Ensure workspace_members record exists
        await admin.from('workspace_members').upsert({
          workspace_id: ow.id, user_id: user.id, role: 'owner',
        }, { onConflict: 'workspace_id,user_id' });
      }
    }

    const allWorkspaces = Array.from(wsMap.values());

    if (allWorkspaces.length === 0) {
      // No workspace — create one
      const { data: newWorkspace } = await admin
        .from('workspaces')
        .insert({ name: `${user.user_metadata?.full_name || 'My'}'s Workspace`, owner_id: user.id, created_by: user.id })
        .select()
        .single();
      if (newWorkspace) {
        await admin.from('workspace_members').insert({ workspace_id: newWorkspace.id, user_id: user.id, role: 'owner' });
        return NextResponse.json({ workspace: newWorkspace, role: 'owner', workspaces: [{ id: newWorkspace.id, name: newWorkspace.name }] });
      }
      return NextResponse.json({ error: 'Could not find or create workspace' }, { status: 404 });
    }

    // If a specific workspace was requested, use it (if user has access)
    let selected = allWorkspaces[0];
    if (requestedId) {
      const found = allWorkspaces.find(w => w.workspace.id === requestedId);
      if (found) selected = found;
    }

    return NextResponse.json({
      workspace: selected.workspace,
      role: selected.role,
      workspaces: allWorkspaces.map(w => ({ id: w.workspace.id, name: w.workspace.name })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/workspace — update workspace brand settings
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getUserClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const admin = getSupabaseAdmin();

    const { data: membership } = await admin
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const updates: Record<string, string> = {};
    if (body.name) updates.name = body.name;
    if (body.brand_color) updates.brand_color = body.brand_color;
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
    if (body.slug) updates.slug = body.slug;

    const { data: workspace, error } = await admin
      .from('workspaces')
      .update(updates)
      .eq('id', membership.workspace_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
