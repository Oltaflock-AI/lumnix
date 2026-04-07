import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// POST /api/beta/redeem — redeem a beta invite code after signup
// Body: { code, email }
export async function POST(req: NextRequest) {
  try {
    const { code, email } = await req.json();
    if (!code?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Code and email are required' }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data: invite } = await db
      .from('beta_invites')
      .select('*')
      .ilike('code', code.trim())
      .single();

    if (!invite || !invite.active) {
      return NextResponse.json({ error: 'Invalid or inactive invite code' }, { status: 400 });
    }

    if (invite.max_uses && invite.uses >= invite.max_uses) {
      return NextResponse.json({ error: 'This invite code has been fully used' }, { status: 400 });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite code has expired' }, { status: 400 });
    }

    // Increment usage
    await db.from('beta_invites').update({ uses: invite.uses + 1 }).eq('id', invite.id);

    // Log the redemption
    await db.from('beta_redemptions').insert({
      invite_id: invite.id,
      email: email.trim().toLowerCase(),
      redeemed_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, plan: invite.plan || 'beta' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
