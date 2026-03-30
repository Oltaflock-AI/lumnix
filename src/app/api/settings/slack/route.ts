import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/settings/slack?workspace_id=xxx
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('workspaces')
    .select('slack_webhook_url')
    .eq('id', workspaceId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    slack_webhook_url: data?.slack_webhook_url || null,
    connected: !!data?.slack_webhook_url,
  });
}

// POST /api/settings/slack — save webhook URL
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { workspace_id, slack_webhook_url } = body;

  if (!workspace_id) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { error } = await db
    .from('workspaces')
    .update({ slack_webhook_url: slack_webhook_url || null })
    .eq('id', workspace_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, connected: !!slack_webhook_url });
}
