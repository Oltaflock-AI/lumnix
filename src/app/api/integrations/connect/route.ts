import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl, SCOPES } from '@/lib/google-oauth';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { checkPlanLimit } from '@/lib/plan-limits';
import { signState } from '@/lib/oauth-state';
import { safeRelativeRedirect } from '@/lib/url-guard';

// POST /api/integrations/connect
// Body: { provider: 'gsc' | 'ga4' | 'google_ads', workspace_id: string }
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { provider, workspace_id, return_to } = await req.json();

    if (!provider || !workspace_id) {
      return NextResponse.json({ error: 'Missing provider or workspace_id' }, { status: 400 });
    }

    // Verify user is a member of this workspace before starting OAuth
    const db = getSupabaseAdmin();
    const { data: membership } = await db
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check plan limit for integrations
    const { data: ws } = await db.from('workspaces').select('plan').eq('id', workspace_id).single();
    const limitError = await checkPlanLimit(workspace_id, ws?.plan || 'free', 'integrations');
    if (limitError) return limitError;

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/callback`;
    // HMAC-signed state includes user_id so callback can verify the same user is completing the flow
    // Normalise return_to to a same-origin relative path so the callback can't
    // be used to bounce the user to "//attacker.example" post-OAuth.
    const safeReturnTo = safeRelativeRedirect(return_to, '/dashboard/settings');
    const state = signState({ provider, workspace_id, user_id: user.id, return_to: safeReturnTo });

    let authUrl: string;

    if (['gsc', 'ga4', 'google_ads'].includes(provider)) {
      const scopes = SCOPES[provider as keyof typeof SCOPES] || [];
      const allScopes = [...scopes, 'openid', 'https://www.googleapis.com/auth/userinfo.email'];
      authUrl = getGoogleAuthUrl(redirectUri, allScopes, state);
    } else if (provider === 'meta_ads') {
      const params = new URLSearchParams({
        client_id: process.env.META_APP_ID || '',
        redirect_uri: redirectUri,
        scope: 'ads_read,ads_management',
        response_type: 'code',
        state,
      });
      authUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
