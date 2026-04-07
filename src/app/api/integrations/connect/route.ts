import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl, SCOPES } from '@/lib/google-oauth';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { checkPlanLimit } from '@/lib/plan-limits';

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

    // Check plan limit for integrations
    const db = getSupabaseAdmin();
    const { data: ws } = await db.from('workspaces').select('plan').eq('id', workspace_id).single();
    const limitError = await checkPlanLimit(workspace_id, ws?.plan || 'free', 'integrations');
    if (limitError) return limitError;

    if (!provider || !workspace_id) {
      return NextResponse.json({ error: 'Missing provider or workspace_id' }, { status: 400 });
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/callback`;
    const state = JSON.stringify({ provider, workspace_id, ...(return_to ? { return_to } : {}) });

    let authUrl: string;

    if (['gsc', 'ga4', 'google_ads'].includes(provider)) {
      const scopes = SCOPES[provider as keyof typeof SCOPES] || [];
      // Add profile scope for account info
      const allScopes = [...scopes, 'openid', 'https://www.googleapis.com/auth/userinfo.email'];
      authUrl = getGoogleAuthUrl(redirectUri, allScopes, Buffer.from(state).toString('base64'));
    } else if (provider === 'meta_ads') {
      // Meta OAuth
      const params = new URLSearchParams({
        client_id: process.env.META_APP_ID || '',
        redirect_uri: redirectUri,
        scope: 'ads_read,ads_management',
        response_type: 'code',
        state: Buffer.from(state).toString('base64'),
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
