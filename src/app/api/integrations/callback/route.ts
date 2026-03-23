import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/google-oauth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/integrations/callback?code=...&state=...
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const stateB64 = req.nextUrl.searchParams.get('state');

    if (!code || !stateB64) {
      return NextResponse.redirect(new URL('/dashboard/settings?error=missing_params', req.url));
    }

    const state = JSON.parse(Buffer.from(stateB64, 'base64').toString());
    const { provider, workspace_id } = state;

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/callback`;

    let tokens: any;
    let displayName = '';
    let providerAccountId = '';

    if (['gsc', 'ga4', 'google_ads'].includes(provider)) {
      tokens = await exchangeCodeForTokens(code, redirectUri);

      if (tokens.error) {
        return NextResponse.redirect(new URL(`/dashboard/settings?error=${tokens.error}`, req.url));
      }

      // Get user email for display
      try {
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userInfo = await userRes.json();
        displayName = userInfo.email || provider;
        providerAccountId = userInfo.id || '';
      } catch {
        displayName = provider;
      }
    } else if (provider === 'meta_ads') {
      // Exchange Meta code for token
      const params = new URLSearchParams({
        client_id: process.env.META_APP_ID || '',
        client_secret: process.env.META_APP_SECRET || '',
        redirect_uri: redirectUri,
        code,
      });
      const metaRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`);
      tokens = await metaRes.json();

      if (tokens.error) {
        return NextResponse.redirect(new URL(`/dashboard/settings?error=${tokens.error.message}`, req.url));
      }

      // Exchange for long-lived token
      const llParams = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: process.env.META_APP_ID || '',
        client_secret: process.env.META_APP_SECRET || '',
        fb_exchange_token: tokens.access_token,
      });
      const llRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${llParams.toString()}`);
      const llTokens = await llRes.json();
      if (llTokens.access_token) {
        tokens.access_token = llTokens.access_token;
        tokens.expires_in = llTokens.expires_in;
      }

      // Get user info
      try {
        const meRes = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${tokens.access_token}`);
        const me = await meRes.json();
        displayName = me.name || 'Meta Ads';
        providerAccountId = me.id || '';
      } catch {
        displayName = 'Meta Ads';
      }
    }

    // Upsert integration (handle reconnects gracefully)
    const { data: integration, error: intError } = await getSupabaseAdmin()
      .from('integrations')
      .upsert({
        workspace_id,
        provider,
        provider_account_id: providerAccountId,
        display_name: displayName,
        status: 'connected',
        connected_at: new Date().toISOString(),
      }, { onConflict: 'workspace_id,provider' })
      .select()
      .single();

    if (intError) {
      console.error('Integration insert error:', intError);
      return NextResponse.redirect(new URL(`/dashboard/settings?error=${encodeURIComponent(intError.message)}`, req.url));
    }

    // Upsert tokens (update on reconnect)
    await getSupabaseAdmin().from('oauth_tokens').upsert({
      integration_id: integration.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      scopes: tokens.scope ? tokens.scope.split(' ') : [],
    });

    return NextResponse.redirect(new URL(`/dashboard/settings?connected=${provider}`, req.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/dashboard/settings?error=unknown', req.url));
  }
}
