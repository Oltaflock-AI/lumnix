import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/rate-limit';

// GET /api/team/accept?token=xxx — accept an invite
export async function GET(req: NextRequest) {
  // Rate limit by IP to prevent token brute-forcing (10 attempts / minute per IP)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
  const rateLimited = rateLimit(`team-accept:${ip}`, 10, 60 * 1000);
  if (rateLimited) return rateLimited;

  const token = req.nextUrl.searchParams.get('token');
  if (!token || token.length < 20 || !/^inv_[a-f0-9]+$/.test(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  try {
    // Look up the invite in team_invites table
    const { data: invite, error } = await db
      .from('team_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !invite) {
      return redirectWithMessage('/auth/signup', 'Invalid or expired invitation link.');
    }

    // Check expiry
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await db.from('team_invites').update({ status: 'expired' }).eq('id', invite.id);
      return redirectWithMessage('/auth/signup', 'This invitation has expired. Please ask for a new one.');
    }

    // Check if already accepted
    if (invite.status === 'accepted') {
      return redirectWithMessage('/dashboard', 'This invitation has already been accepted.');
    }

    // Mark invite as accepted
    await db.from('team_invites').update({ status: 'accepted' }).eq('id', invite.id);

    // Look up user by email. Supabase admin API doesn't expose email filter directly,
    // so we use listUsers here (accepted trade-off — this runs at most once per invite claim
    // and is rate limited by IP).
    const email = invite.email?.toLowerCase();
    let existingUser: any = null;
    if (email) {
      try {
        const { data: { users } } = await db.auth.admin.listUsers();
        existingUser = users?.find((u: any) => u.email?.toLowerCase() === email) || null;
      } catch {
        existingUser = null;
      }
    }

    if (existingUser) {
      // User exists — add them as a workspace member if not already
      const { data: existingMember } = await db
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', invite.workspace_id)
        .eq('user_id', existingUser.id)
        .single();

      if (!existingMember) {
        await db.from('workspace_members').insert({
          workspace_id: invite.workspace_id,
          user_id: existingUser.id,
          role: invite.role || 'member',
        });
      }

      // Redirect to dashboard
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumnix-ai.vercel.app';
      return NextResponse.redirect(`${appUrl}/dashboard?invite_accepted=true`);
    }

    // User doesn't exist — redirect to signup with invite context
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumnix-ai.vercel.app';
    return NextResponse.redirect(`${appUrl}/auth/signup?invite=${token}&email=${encodeURIComponent(invite.email)}`);
  } catch (error: any) {
    console.error('Team accept error:', error);
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }
}

function redirectWithMessage(path: string, message: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumnix-ai.vercel.app';
  return NextResponse.redirect(`${appUrl}${path}?message=${encodeURIComponent(message)}`);
}
