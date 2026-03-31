import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fetchMetaAdAccounts } from '@/lib/connectors/meta-ads';

// GET /api/meta/accounts?integration_id=...
// Returns all ad accounts for the connected Meta token
export async function GET(req: NextRequest) {
  try {
    const integrationId = req.nextUrl.searchParams.get('integration_id');
    if (!integrationId) {
      return NextResponse.json({ error: 'integration_id required' }, { status: 400 });
    }

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
