import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { featuresEmail, powerTipsEmail } from '@/lib/emails/onboarding';

// POST /api/onboarding/sequence — cron job to send follow-up emails
// Email 2: Day 2 after signup (features deep dive)
// Email 3: Day 5 after signup (power tips)
export async function POST(req: NextRequest) {
  try {
    // STRICT cron-only gate. Prior version returned Unauthorized only when the
    // env was set — meaning a deploy with a missing CRON_SECRET let any authed
    // user POST this endpoint and blast every Supabase user with onboarding mail.
    // Fail closed: require the secret to be configured AND to match.
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });

    const db = getSupabaseAdmin();
    const now = new Date();

    // Get all users
    const { data: { users } } = await db.auth.admin.listUsers();
    if (!users?.length) return NextResponse.json({ sent: 0 });

    let sent = 0;

    for (const user of users) {
      const createdAt = new Date(user.created_at);
      const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const email = user.email;
      const name = user.user_metadata?.full_name || user.user_metadata?.name || '';

      if (!email) continue;

      // Check what emails have been sent (stored in user metadata)
      const onboardingEmails = user.user_metadata?.onboarding_emails || [];

      // Email 2: Day 2 (features)
      if (daysSinceSignup >= 2 && !onboardingEmails.includes('features')) {
        const { subject, html } = featuresEmail(name);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'Lumnix <hello@oltaflock.ai>', to: [email], subject, html }),
        });
        if (res.ok) {
          await db.auth.admin.updateUserById(user.id, {
            user_metadata: { ...user.user_metadata, onboarding_emails: [...onboardingEmails, 'features'] },
          });
          sent++;
        }
      }

      // Email 3: Day 5 (power tips)
      if (daysSinceSignup >= 5 && !onboardingEmails.includes('power_tips')) {
        const { subject, html } = powerTipsEmail(name);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'Lumnix <hello@oltaflock.ai>', to: [email], subject, html }),
        });
        if (res.ok) {
          await db.auth.admin.updateUserById(user.id, {
            user_metadata: { ...user.user_metadata, onboarding_emails: [...(user.user_metadata?.onboarding_emails || []), 'features', 'power_tips'] },
          });
          sent++;
        }
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
