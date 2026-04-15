import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { welcomeEmail } from '@/lib/emails/onboarding';
import { rateLimit } from '@/lib/rate-limit';

// POST /api/onboarding/welcome — send welcome email to the authenticated user only.
// Prior version accepted an arbitrary `email` in the body — that was an email-bomb
// primitive (any logged-in user could blast Lumnix-branded mail to any address).
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fire-once-per-user cap; welcome email should never loop.
    const limited = rateLimit(`welcome:${user.id}`, 1, 24 * 60 * 60 * 1000);
    if (limited) return limited;

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });

    const name = (user.user_metadata?.full_name || user.user_metadata?.name || '') as string;
    const { subject, html } = welcomeEmail(name);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Lumnix <hello@oltaflock.ai>',
        to: [user.email],
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message || 'Send failed' }, { status: 500 });

    return NextResponse.json({ success: true, emailId: data.id });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
