import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/google-oauth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyState } from '@/lib/oauth-state';
import { safeRelativeRedirect } from '@/lib/url-guard';

// GET /api/integrations/callback?code=...&state=...
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const signedState = req.nextUrl.searchParams.get('state');

    if (!code || !signedState) {
      return NextResponse.redirect(new URL('/dashboard/settings?error=missing_params', req.url));
    }

    // Verify HMAC-signed state — prevents CSRF / state forgery
    const state = verifyState(signedState);
    if (!state) {
      return NextResponse.redirect(new URL('/dashboard/settings?error=invalid_state', req.url));
    }
    const { provider, workspace_id, user_id } = state;

    // Defense-in-depth: re-verify the user who initiated OAuth is still a workspace member
    const { data: membership } = await getSupabaseAdmin()
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user_id)
      .single();
    if (!membership) {
      return NextResponse.redirect(new URL('/dashboard/settings?error=access_denied', req.url));
    }

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

    // Check if integration already exists, update or insert
    const { data: existing } = await getSupabaseAdmin()
      .from('integrations')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('provider', provider)
      .maybeSingle();

    let integration: any;
    let intError: any;

    if (existing) {
      const { data, error } = await getSupabaseAdmin()
        .from('integrations')
        .update({
          provider_account_id: providerAccountId,
          display_name: displayName,
          status: 'connected',
          connected_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      integration = data;
      intError = error;
    } else {
      const { data, error } = await getSupabaseAdmin()
        .from('integrations')
        .insert({
          workspace_id,
          provider,
          provider_account_id: providerAccountId,
          display_name: displayName,
          status: 'connected',
          connected_at: new Date().toISOString(),
        })
        .select()
        .single();
      integration = data;
      intError = error;
    }

    if (intError) {
      console.error('Integration insert error:', intError);
      return NextResponse.redirect(new URL(`/dashboard/settings?error=${encodeURIComponent(intError.message)}`, req.url));
    }

    // Delete old token and insert fresh
    await getSupabaseAdmin().from('oauth_tokens').delete().eq('integration_id', integration.id);
    await getSupabaseAdmin().from('oauth_tokens').insert({
      integration_id: integration.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      scopes: tokens.scope ? tokens.scope.split(' ') : [],
    });

    // Redirect back to the safe relative target captured at /connect time.
    // Defense in depth: re-normalise even though /connect already validated.
    const returnTo = safeRelativeRedirect(state.return_to, '/dashboard/settings');
    return NextResponse.redirect(new URL(`${returnTo}?connected=${provider}`, req.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    const stateStr = req.nextUrl.searchParams.get('state');
    let returnTo = '/dashboard/settings';
    if (stateStr) {
      const s = verifyState(stateStr);
      if (s?.return_to) returnTo = safeRelativeRedirect(s.return_to, '/dashboard/settings');
    }
    return NextResponse.redirect(new URL(`${returnTo}?error=unknown`, req.url));
  }
}
