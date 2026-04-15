import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

async function verifyWorkspaceMembership(userId: string, workspaceId: string) {
  const { data } = await getSupabaseAdmin()
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();
  return data;
}

// GET /api/agent/actions?workspace_id=...&status=suggested
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  const status = req.nextUrl.searchParams.get('status');
  if (!workspaceId) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });

  const member = await verifyWorkspaceMembership(userId, workspaceId);
  if (!member) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  let query = getSupabaseAdmin().from('agent_actions').select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ actions: data || [] });
}

// POST /api/agent/actions — create a suggested action
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { workspace_id, action_type, title, description, reason, priority, action_data } = await req.json();
    if (!workspace_id || !action_type || !title) {
      return NextResponse.json({ error: 'workspace_id, action_type, title required' }, { status: 400 });
    }

    const member = await verifyWorkspaceMembership(userId, workspace_id);
    if (!member) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { data, error } = await getSupabaseAdmin().from('agent_actions').insert({
      workspace_id, action_type, title, description, reason,
      priority: priority || 'medium',
      action_data: action_data || {},
      status: 'suggested',
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/agent/actions — approve/reject/execute an action
export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { action_id, status } = await req.json();
    if (!action_id || !status) {
      return NextResponse.json({ error: 'action_id and status required' }, { status: 400 });
    }

    if (!['approved', 'rejected', 'executed', 'failed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify user owns the workspace this action belongs to
    const { data: action } = await getSupabaseAdmin()
      .from('agent_actions')
      .select('workspace_id')
      .eq('id', action_id)
      .single();
    if (!action) return NextResponse.json({ error: 'Action not found' }, { status: 404 });

    const member = await verifyWorkspaceMembership(userId, action.workspace_id);
    if (!member) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const updates: any = { status };
    if (status === 'approved') updates.approved_at = new Date().toISOString();
    if (status === 'executed') updates.executed_at = new Date().toISOString();

    const { data, error } = await getSupabaseAdmin()
      .from('agent_actions')
      .update(updates)
      .eq('id', action_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
