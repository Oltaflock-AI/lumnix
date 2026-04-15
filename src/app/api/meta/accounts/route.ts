import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchMetaAdAccounts } from '@/lib/connectors/meta-ads';
import { verifyIntegrationInWorkspace } from '@/lib/auth-guard';

// GET /api/meta/accounts?integration_id=...&workspace_id=...
// Returns all ad accounts for the connected Meta token.
//
// Both query params are required. Previously the route accepted only
// integration_id and would happily return any workspace's Meta ad accounts
// if the caller guessed the id — middleware had no workspace to check against.
export async function GET(req: NextRequest) {
  try {
    const integrationId = req.nextUrl.searchParams.get('integration_id');
    const workspaceId = req.nextUrl.searchParams.get('workspace_id');

    if (!integrationId || !workspaceId) {
      return NextResponse.json({ error: 'integration_id and workspace_id required' }, { status: 400 });
    }

    // Middleware validated that the caller belongs to workspace_id. Here we
    // confirm the integration actually lives in that workspace before we
    // dereference its oauth token.
    const integrationCheck = await verifyIntegrationInWorkspace(integrationId, workspaceId);
    if (integrationCheck) return integrationCheck;

    const { data: tokenRow } = await getSupabaseAdmin()
      .from('oauth_tokens')
      .select('access_token')
      .eq('integration_id', integrationId)
      .single();

    if (!tokenRow) {
      return NextResponse.json({ error: 'No token found' }, { status: 404 });
    }

    const accounts = await fetchMetaAdAccounts(tokenRow.access_token);
    return NextResponse.json({
      accounts: accounts.map((a: any) => ({
        id: a.id,
        name: a.name,
        currency: a.currency,
        status: a.account_status,
        timezone: a.timezone_name,
      })),
    });
  } catch (error) {
    console.error('[meta/accounts] Error:', error);
    return NextResponse.json({ error: 'Failed to load Meta accounts' }, { status: 500 });
  }
}
