import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

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
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unable to find your email address' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Generate the password reset link via Supabase Admin
    const db = getSupabaseAdmin();
    const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: {
        redirectTo: `${appUrl}/auth/callback?next=/dashboard/settings`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Failed to generate reset link:', linkError);
      return NextResponse.json({ error: 'Failed to generate reset link' }, { status: 500 });
    }

    const resetLink = linkData.properties.action_link;
    const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email.split('@')[0];

    // Send branded email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
    }

    const senderEmail = process.env.RESEND_FROM_EMAIL || 'noreply@oltaflock.ai';
    const resend = new Resend(resendKey);

    const { error: emailError } = await resend.emails.send({
      from: `Lumnix <${senderEmail}>`,
      to: user.email,
      subject: 'Reset your Lumnix password',
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
  <h1>Reset your password</h1>
  <p>Hey ${firstName}, we received a request to reset your Lumnix account password.</p>
  <p>Click the button below to set a new password:</p>
  <a href="${resetLink}" class="btn">Reset Password</a>
  <hr class="divider">
  <p class="footer">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
</div>
</body>
</html>`,
    });

    if (emailError) {
      console.error('Resend email error:', emailError);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
