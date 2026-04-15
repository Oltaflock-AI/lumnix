import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// POST /api/beta/validate — check if a beta invite code is valid
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    const trimmed = typeof code === 'string' ? code.trim() : '';
    // Reject SQL wildcards (%, _) and anything outside the code alphabet.
    // Without this, ilike('%') would match every row and leak a valid invite.
    if (!/^[A-Za-z0-9_-]{3,64}$/.test(trimmed)) {
      return NextResponse.json({ valid: false, error: 'Invalid invite code' }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data: invite } = await db
      .from('beta_invites')
      .select('*')
      .ilike('code', trimmed)
      .single();

    if (!invite) {
      return NextResponse.json({ valid: false, error: 'Invalid invite code' });
    }

    if (!invite.active) {
      return NextResponse.json({ valid: false, error: 'This invite code is no longer active' });
    }

    if (invite.max_uses && invite.uses >= invite.max_uses) {
      return NextResponse.json({ valid: false, error: 'This invite code has been fully used' });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This invite code has expired' });
    }

    return NextResponse.json({ valid: true, plan: invite.plan || 'beta' });
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
  }
}
