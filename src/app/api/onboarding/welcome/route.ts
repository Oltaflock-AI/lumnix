import { NextRequest, NextResponse } from 'next/server';
import { welcomeEmail } from '@/lib/emails/onboarding';

// POST /api/onboarding/welcome — send welcome email (called after signup)
export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });

    const { subject, html } = welcomeEmail(name || '');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Lumnix <hello@oltaflock.ai>',
        to: [email],
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message || 'Send failed' }, { status: 500 });

    return NextResponse.json({ success: true, emailId: data.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
