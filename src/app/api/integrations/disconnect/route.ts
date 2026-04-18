import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyWorkspaceAccess } from '@/lib/auth-guard';
import { revokeGoogleToken } from '@/lib/google-oauth';

// Best-effort revoke Meta long-lived user token.
async function revokeMetaToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${encodeURIComponent(token)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

// POST /api/integrations/disconnect — remove an integration and its tokens
export async function POST(req: NextRequest) {
  try {
    const { integration_id } = await req.json();
    if (!integration_id || typeof integration_id !== 'string') {
      return NextResponse.json({ error: 'integration_id required' }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Look up the integration's workspace + provider + tokens before deleting
    const { data: integration } = await db
      .from('integrations')
      .select('id, workspace_id, provider, oauth_tokens(access_token, refresh_token)')
      .eq('id', integration_id)
      .single();

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Verify caller is a member of that workspace
    const access = await verifyWorkspaceAccess(req, integration.workspace_id);
    if (access instanceof NextResponse) return access;

    // Best-effort revoke at provider so leaked tokens die immediately.
    // Fire sequentially (not parallel) to keep rate-limit exposure small;
    // ignore failures — DB deletion is still the source of truth.
    const tokenRow = (integration.oauth_tokens as any)?.[0]
      || (integration as any).oauth_tokens;
    if (tokenRow?.access_token) {
      if (['gsc', 'ga4', 'google_ads'].includes(integration.provider)) {
        // Prefer revoking the refresh token — kills every access token derived from it.
        await revokeGoogleToken(tokenRow.refresh_token || tokenRow.access_token);
      } else if (integration.provider === 'meta_ads') {
        await revokeMetaToken(tokenRow.access_token);
      }
    }

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
