import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';

// POST /api/integrations/disconnect — remove an integration and its tokens
export async function POST(req: NextRequest) {
  try {
    const { integration_id } = await req.json();
    if (!integration_id || typeof integration_id !== 'string') {
      return NextResponse.json({ error: 'integration_id required' }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Look up the integration's workspace before deleting
    const { data: integration } = await db
      .from('integrations')
      .select('id, workspace_id')
      .eq('id', integration_id)
      .single();

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Verify caller is a member of that workspace
    const access = await verifyWorkspaceAccess(req, integration.workspace_id);
    if (access instanceof NextResponse) return access;

    // Delete OAuth tokens first, then integration
    await db.from('oauth_tokens').delete().eq('integration_id', integration_id);
    const { error } = await db.from('integrations').delete().eq('id', integration_id);

    if (error) {
      return NextResponse.json({ error: 'Failed to disconnect integration' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to disconnect integration' }, { status: 500 });
  }
}
