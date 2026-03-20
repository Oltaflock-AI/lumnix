import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 're_placeholder');
}
const MAX_FREE_MEMBERS = 2;

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

    const { email, workspace_id } = await req.json();
    if (!email || !workspace_id) return NextResponse.json({ error: 'Missing email or workspace_id' }, { status: 400 });

    const db = getSupabaseAdmin();

    // Verify requester owns this workspace
    const { data: workspace } = await db.from('workspaces').select('id, name, owner_id').eq('id', workspace_id).single();
    if (!workspace || workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this workspace' }, { status: 403 });
    }

    // Check member count (max 2 free members)
    const { data: members } = await db.from('workspace_members').select('id').eq('workspace_id', workspace_id);
    const currentCount = (members?.length || 1) - 1; // subtract owner
    if (currentCount >= MAX_FREE_MEMBERS) {
      return NextResponse.json({ error: `Free plan allows ${MAX_FREE_MEMBERS} team members. Upgrade to add more.` }, { status: 403 });
    }

    // Check if already invited/member
    const { data: existing } = await db.from('team_invites').select('id, status').eq('workspace_id', workspace_id).eq('email', email.toLowerCase()).single();
    if (existing && existing.status === 'pending') {
      return NextResponse.json({ error: 'Invite already sent to this email' }, { status: 409 });
    }

    // Create invite token
    const token = `inv_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await db.from('team_invites').upsert({
      workspace_id,
      email: email.toLowerCase(),
      invited_by: user.id,
      token,
      status: 'pending',
      expires_at: expiresAt,
    }, { onConflict: 'workspace_id,email' });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?invite=${token}`;
    const inviterName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone';

    // Try sending email via Resend
    let emailSent = false;
    try {
      const { error: emailError } = await getResend().emails.send({
        from: 'Lumnix <onboarding@resend.dev>',
        to: email,
        subject: `${inviterName} invited you to join ${workspace.name} on Lumnix`,
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
  <h1>You've been invited! 🎉</h1>
  <p><strong style="color:#f8fafc">${inviterName}</strong> has invited you to join the <strong style="color:#f8fafc">${workspace.name}</strong> workspace on Lumnix.</p>
  <p>Click the button below to create your free account:</p>
  <a href="${inviteUrl}" class="btn">Accept Invitation →</a>
  <hr class="divider">
  <p class="footer">Expires in 7 days · © 2026 Oltaflock AI</p>
</div>
</body>
</html>`,
      });
      if (!emailError) emailSent = true;
    } catch (e) {
      console.error('Email send failed:', e);
    }

    // Always return success with the invite link (so it works even if email fails)
    return NextResponse.json({
      success: true,
      emailSent,
      inviteUrl,
      message: emailSent ? `Invite sent to ${email}` : `Invite created — email couldn't be sent (domain not verified). Share this link manually.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
      db.from('team_invites').select('id, email, status, expires_at, created_at').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      members: membersRes.data || [],
      invites: invitesRes.data || [],
      canInviteMore: ((membersRes.data?.length || 1) - 1) < MAX_FREE_MEMBERS,
      slotsUsed: Math.max(0, (membersRes.data?.length || 1) - 1),
      maxSlots: MAX_FREE_MEMBERS,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


