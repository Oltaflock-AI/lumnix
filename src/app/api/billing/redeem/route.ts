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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getUserClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { code, workspace_id } = await req.json();
    const trimmedCode = typeof code === 'string' ? code.trim() : '';
    // Reject SQL wildcards so ilike('%') cannot match every coupon row.
    if (!/^[A-Za-z0-9_-]{3,64}$/.test(trimmedCode) || !workspace_id) {
      return NextResponse.json({ error: 'Missing coupon code or workspace' }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // Verify user owns this workspace
    const { data: workspace } = await db
      .from('workspaces')
      .select('id, name, owner_id, plan')
      .eq('id', workspace_id)
      .single();

    if (!workspace || workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this workspace' }, { status: 403 });
    }

    // Find coupon (case-insensitive)
    const { data: coupon } = await db
      .from('coupon_codes')
      .select('*')
      .ilike('code', trimmedCode)
      .single();

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    if (!coupon.active) {
      return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 });
    }

    if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    // Check if workspace already redeemed this coupon
    const { data: existing } = await db
      .from('coupon_redemptions')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('workspace_id', workspace_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'This coupon has already been redeemed for this workspace' }, { status: 409 });
    }

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + coupon.duration_days);

    // Optimistic concurrency on times_used: only the first parallel request
    // matches the exact snapshot value, blocking two-way max_uses bypass.
    const { data: incremented, error: incErr } = await db
      .from('coupon_codes')
      .update({ times_used: coupon.times_used + 1 })
      .eq('id', coupon.id)
      .eq('times_used', coupon.times_used)
      .select('id');

    if (incErr || !incremented || incremented.length === 0) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 409 });
    }

    const { error: redemptionErr } = await db.from('coupon_redemptions').insert({
      coupon_id: coupon.id,
      workspace_id,
      user_id: user.id,
      plan_granted: coupon.plan,
      expires_at: expiresAt.toISOString(),
    });
    if (redemptionErr) {
      await db.from('coupon_codes')
        .update({ times_used: coupon.times_used })
        .eq('id', coupon.id)
        .eq('times_used', coupon.times_used + 1);
      return NextResponse.json({ error: 'This coupon has already been redeemed for this workspace' }, { status: 409 });
    }

    await db.from('workspaces').update({ plan: coupon.plan }).eq('id', workspace_id);

    return NextResponse.json({
      success: true,
      plan: coupon.plan,
      duration_days: coupon.duration_days,
      expires_at: expiresAt.toISOString(),
      message: `🎉 ${coupon.plan.charAt(0).toUpperCase() + coupon.plan.slice(1)} plan activated for ${coupon.duration_days} days!`,
    });
  } catch (error: any) {
    console.error('Redeem error:', error);
    return NextResponse.json({ error: 'Redemption failed' }, { status: 500 });
  }
}
