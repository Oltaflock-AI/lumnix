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

    // Check for coupon redemption on this workspace
    const { data: redemptions, error: redemptionErr } = await db
      .from('coupon_redemptions')
      .select('plan_granted, expires_at, redeemed_at')
      .eq('workspace_id', workspaceId)
      .order('redeemed_at', { ascending: false })
      .limit(1);

    if (redemptionErr) {
      console.error('Coupon redemption query error:', redemptionErr);
    }

    let redemption = redemptions?.[0];

    // If no redemption for this workspace, check by user_id (cross-workspace coupon)
    if (!redemption) {
      const { data: userRedemptions } = await db
        .from('coupon_redemptions')
        .select('plan_granted, expires_at, redeemed_at')
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false })
        .limit(1);
      redemption = userRedemptions?.[0];
    }

    if (redemption) {
      const expiresAt = new Date(redemption.expires_at);
      const now = new Date();
      const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return NextResponse.json({
        type: 'coupon',
        plan: redemption.plan_granted,
        started_at: redemption.redeemed_at,
        expires_at: redemption.expires_at,
        days_left: daysLeft,
        is_expired: daysLeft <= 0,
      });
    }

    // Fallback: check workspace plan
    const { data: workspace } = await db
      .from('workspaces')
      .select('plan')
      .eq('id', workspaceId)
      .single();

    return NextResponse.json({
      type: workspace?.plan && workspace.plan !== 'free' ? 'active' : 'free',
      plan: workspace?.plan || 'free',
    });
  } catch (error: any) {
    console.error('Subscription info error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription info' }, { status: 500 });
  }
}
