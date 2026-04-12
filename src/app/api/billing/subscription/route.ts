import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

function getUserClient(authHeader: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getUserClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = req.nextUrl.searchParams.get('workspace_id');
    if (!workspaceId) return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });

    const db = getSupabaseAdmin();

    // Check for active coupon redemption
    const { data: redemption } = await db
      .from('coupon_redemptions')
      .select('plan_granted, expires_at, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (redemption) {
      const expiresAt = new Date(redemption.expires_at);
      const now = new Date();
      const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return NextResponse.json({
        type: 'coupon',
        plan: redemption.plan_granted,
        started_at: redemption.created_at,
        expires_at: redemption.expires_at,
        days_left: daysLeft,
        is_expired: daysLeft <= 0,
      });
    }

    // Check for Stripe subscription
    const { data: workspace } = await db
      .from('workspaces')
      .select('plan, stripe_subscription_id, stripe_customer_id')
      .eq('id', workspaceId)
      .single();

    if (workspace?.stripe_subscription_id) {
      return NextResponse.json({
        type: 'stripe',
        plan: workspace.plan,
        stripe_subscription_id: workspace.stripe_subscription_id,
      });
    }

    // Free plan
    return NextResponse.json({
      type: 'free',
      plan: workspace?.plan || 'free',
    });
  } catch (error: any) {
    console.error('Subscription info error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription info' }, { status: 500 });
  }
}
