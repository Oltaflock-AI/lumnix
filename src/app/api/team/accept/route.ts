import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumnix-ai.vercel.app';
  const db = getSupabaseAdmin();

  // Read browser session (if user is already logged into Lumnix in this browser)
  const sessionRes = NextResponse.next();
  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            sessionRes.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  const { data: { user: sessionUser } } = await sessionClient.auth.getUser();

  try {
    // Look up the invite
    const { data: invite, error } = await db
      .from('team_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !invite) {
      return redirectWithMessage('/auth/signup', 'Invalid or expired invitation link.');
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await db.from('team_invites').update({ status: 'expired' }).eq('id', invite.id);
      return redirectWithMessage('/auth/signup', 'This invitation has expired. Please ask for a new one.');
    }

    if (invite.status === 'accepted') {
      // Still try to join if the current session matches — idempotent add.
      if (sessionUser && sessionUser.email?.toLowerCase() === invite.email?.toLowerCase()) {
        await ensureWorkspaceMember(db, invite.workspace_id, sessionUser.id, invite.role || 'member');
        return NextResponse.redirect(`${appUrl}/dashboard?invite_accepted=true&workspace_id=${invite.workspace_id}`);
      }
      return redirectWithMessage('/dashboard', 'This invitation has already been accepted.');
    }

    const inviteEmail = invite.email?.toLowerCase();

    // Case 1: user logged into Lumnix with the invited email — join + dashboard.
    if (sessionUser && sessionUser.email?.toLowerCase() === inviteEmail) {
      await ensureWorkspaceMember(db, invite.workspace_id, sessionUser.id, invite.role || 'member');
      await db.from('team_invites').update({ status: 'accepted' }).eq('id', invite.id);
      return NextResponse.redirect(`${appUrl}/dashboard?invite_accepted=true&workspace_id=${invite.workspace_id}`);
    }

    // Case 2: user logged in with a different email — send to signin with the invite preserved.
    if (sessionUser && sessionUser.email?.toLowerCase() !== inviteEmail) {
      const msg = `This invite is for ${invite.email}. Please sign in with that email.`;
      return NextResponse.redirect(
        `${appUrl}/auth/signin?redirect=${encodeURIComponent(`/api/team/accept?token=${token}`)}&message=${encodeURIComponent(msg)}`
      );
    }

    // Case 3: no session — check if an account with this email already exists.
    let existingUser: any = null;
    if (inviteEmail) {
      existingUser = await findUserByEmail(db, inviteEmail);
    }

    if (existingUser) {
      // Account exists but not logged in → signin, then loop back to accept.
      return NextResponse.redirect(
        `${appUrl}/auth/signin?redirect=${encodeURIComponent(`/api/team/accept?token=${token}`)}&message=${encodeURIComponent('Sign in to accept your workspace invite.')}`
      );
    }

    // Case 4: no account → signup with invite context.
    // Use `team_invite` (not `invite`) so it doesn't collide with the beta-code field.
    return NextResponse.redirect(
      `${appUrl}/auth/signup?team_invite=${token}&email=${encodeURIComponent(invite.email)}`
    );
  } catch (e: any) {
    console.error('Team accept error:', e);
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }
}

async function ensureWorkspaceMember(
  db: ReturnType<typeof getSupabaseAdmin>,
  workspaceId: string,
  userId: string,
  role: string,
) {
  const { data: existing } = await db
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!existing) {
    await db.from('workspace_members').insert({
      workspace_id: workspaceId,
      user_id: userId,
      role,
    });
  }
}

async function findUserByEmail(
  db: ReturnType<typeof getSupabaseAdmin>,
  email: string,
): Promise<any | null> {
  // Paginate through admin listUsers. Supabase caps perPage at 1000.
  // This runs at most on invite-accept (rate-limited per IP).
  for (let page = 1; page <= 10; page++) {
    try {
      const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
      const users = data?.users || [];
      const match = users.find((u: any) => u.email?.toLowerCase() === email);
      if (match) return match;
      if (users.length < 1000) break;
    } catch {
      return null;
    }
  }
  return null;
}

function redirectWithMessage(path: string, message: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumnix-ai.vercel.app';
  return NextResponse.redirect(`${appUrl}${path}?message=${encodeURIComponent(message)}`);
}
