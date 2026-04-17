import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { rateLimit } from '@/lib/rate-limit';
import { escapeHtml } from '@/lib/html-escape';

function getResend(key: string) {
  return new Resend(key);
}
// Derive from plan-limits.ts — single source of truth
import { PLAN_LIMITS, type PlanLimits } from '@/lib/plan-limits';
const PLAN_MEMBER_LIMITS: Record<string, number> = Object.fromEntries(
  Object.entries(PLAN_LIMITS).map(([plan, limits]: [string, PlanLimits]) => [plan, limits.teamMembers === Infinity ? 999 : limits.teamMembers])
);

function getUserClient(authHeader: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

// POST /api/team/invite — send invite email
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getUserClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Cap invite sends per owner: 20 / hour. Prevents email-send DoS.
    const limited = rateLimit(`team-invite:${user.id}`, 20, 60 * 60 * 1000);
    if (limited) return limited;

    const { email, workspace_id, role } = await req.json();
    if (!email || !workspace_id) return NextResponse.json({ error: 'Missing email or workspace_id' }, { status: 400 });
    const memberRole = ['admin', 'member', 'viewer'].includes(role) ? role : 'member';

    const db = getSupabaseAdmin();

    // Verify requester owns this workspace
    const { data: workspace } = await db.from('workspaces').select('id, name, owner_id, plan').eq('id', workspace_id).single();
    if (!workspace || workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this workspace' }, { status: 403 });
    }

    // Check member count against plan limit
    const maxMembers = PLAN_MEMBER_LIMITS[workspace.plan || 'free'] || PLAN_MEMBER_LIMITS.free;
    const { data: members } = await db.from('workspace_members').select('id').eq('workspace_id', workspace_id);
    const currentCount = (members?.length || 1) - 1; // subtract owner
    if (currentCount >= maxMembers) {
      return NextResponse.json({ error: `${(workspace.plan || 'free')} plan allows ${maxMembers} team members. Upgrade to add more.` }, { status: 403 });
    }

    // Check if already invited/member
    const { data: existing } = await db.from('team_invites').select('id, status').eq('workspace_id', workspace_id).eq('email', email.toLowerCase()).single();
    if (existing && existing.status === 'pending') {
      return NextResponse.json({ error: 'Invite already sent to this email' }, { status: 409 });
    }

    // Create invite token
    const token = `inv_${crypto.randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await db.from('team_invites').upsert({
      workspace_id,
      email: email.toLowerCase(),
      invited_by: user.id,
      token,
      role: memberRole,
      status: 'pending',
      expires_at: expiresAt,
    }, { onConflict: 'workspace_id,email' });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/team/accept?token=${token}`;
    const inviterName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone';

    // Try sending email via Resend
    let emailSent = false;
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.warn('RESEND_API_KEY not set — skipping invite email');
    } else {
      const senderEmail = process.env.RESEND_FROM_EMAIL || 'noreply@oltaflock.ai';
      try {
        const { data: emailData, error: emailError } = await getResend(resendKey).emails.send({
          from: `Lumnix <${senderEmail}>`,
          to: email,
          subject: `${inviterName.slice(0, 80)} invited you to join ${(workspace.name || '').slice(0, 80)} on Lumnix`,
          html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
.container { max-width: 520px; margin: 40px auto; padding: 40px; background: #1e293b; border-radius: 16px; border: 1px solid #334155; }
.logo { font-size: 28px; font-weight: 900; letter-spacing: -1.5px; margin-bottom: 32px; }
.logo .l { color: #7c3aed; }
h1 { font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 12px; }
p { font-size: 15px; color: #94a3b8; line-height: 1.6; margin: 0 0 20px; }
.btn { display: inline-block; padding: 14px 28px; background: #7c3aed; color: white; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600; }
.divider { border: none; border-top: 1px solid #334155; margin: 24px 0; }
.footer { font-size: 12px; color: #475569; }
</style></head>
<body>
<div class="container">
  <div class="logo"><span class="l">L</span>umnix</div>
  <h1>You've been invited!</h1>
  <p><strong style="color:#f8fafc">${escapeHtml(inviterName)}</strong> has invited you to join the <strong style="color:#f8fafc">${escapeHtml(workspace.name)}</strong> workspace on Lumnix.</p>
  <p>Click the button below to create your free account:</p>
  <a href="${encodeURI(inviteUrl)}" class="btn">Accept Invitation</a>
  <hr class="divider">
  <p class="footer">Expires in 7 days</p>
</div>
</body>
</html>`,
        });
        if (emailError) {
          console.error('Resend API error:', emailError);
        } else {
          emailSent = true;
          console.log('Invite email sent:', emailData?.id);
        }
      } catch (e) {
        console.error('Email send failed:', e);
      }
    }

    // Always return success with the invite link (so it works even if email fails)
    return NextResponse.json({
      success: true,
      emailSent,
      inviteUrl,
      message: emailSent ? `Invite sent to ${email}` : `Invite created — email couldn't be sent (domain not verified). Share this link manually.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/team/invite?invite_id=<id> — revoke a pending invite
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getUserClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const inviteId = req.nextUrl.searchParams.get('invite_id');
    const workspaceId = req.nextUrl.searchParams.get('workspace_id');
    if (!inviteId || !workspaceId) return NextResponse.json({ error: 'Missing invite_id or workspace_id' }, { status: 400 });

    const db = getSupabaseAdmin();

    // Verify requester owns this workspace
    const { data: workspace } = await db.from('workspaces').select('id, owner_id').eq('id', workspaceId).single();
    if (!workspace || workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this workspace' }, { status: 403 });
    }

    // Only allow revoking pending invites
    const { data: invite } = await db.from('team_invites').select('id, status').eq('id', inviteId).eq('workspace_id', workspaceId).single();
    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    if (invite.status !== 'pending') return NextResponse.json({ error: 'Can only revoke pending invites' }, { status: 400 });

    await db.from('team_invites').delete().eq('id', inviteId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/team/invite — list current members + invites
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

    const [membersRes, invitesRes] = await Promise.all([
      db.from('workspace_members').select('id, user_id, role, created_at').eq('workspace_id', workspaceId),
      db.from('team_invites').select('id, email, role, token, status, expires_at, created_at').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
    ]);

    // Enrich members with user details — fetch only workspace member users, not all users
    const memberUserIds = (membersRes.data || []).map((m: any) => m.user_id);
    const userMap = new Map<string, { name: string; email: string }>();
    for (const uid of memberUserIds) {
      const { data: { user: u } } = await db.auth.admin.getUserById(uid);
      if (u) {
        userMap.set(u.id, {
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Unknown',
          email: u.email || '',
        });
      }
    }

    const enrichedMembers = (membersRes.data || []).map((m: any) => ({
      ...m,
      name: userMap.get(m.user_id)?.name || 'Unknown',
      email: userMap.get(m.user_id)?.email || '',
    }));

    // Get workspace plan for member limits
    const { data: ws } = await db.from('workspaces').select('plan').eq('id', workspaceId).single();
    const maxSlots = PLAN_MEMBER_LIMITS[ws?.plan || 'free'] || PLAN_MEMBER_LIMITS.free;

    const pendingInvites = (invitesRes.data || []).filter((i: any) => i.status === 'pending');
    // slotsUsed = non-owner members already joined + pending invites
    const joinedNonOwner = Math.max(0, (membersRes.data?.length || 1) - 1);
    const slotsUsed = joinedNonOwner + pendingInvites.length;

    return NextResponse.json({
      members: enrichedMembers,
      invites: invitesRes.data || [],
      canInviteMore: slotsUsed < maxSlots,
      slotsUsed,
      maxSlots,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


