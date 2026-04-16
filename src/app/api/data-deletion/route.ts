import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { escapeHtml } from '@/lib/html-escape';

export async function POST(req: NextRequest) {
  try {
    // Rate limit per IP to prevent admin email flooding (3 requests / hour)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || req.headers.get('x-real-ip')
      || 'unknown';
    const rateLimited = rateLimit(`data-deletion:${ip}`, 3, 60 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const { email } = await req.json();

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Send notification to admin
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Lumnix <notifications@oltaflock.ai>',
          to: ['admin@oltaflock.ai', 'khush@oltaflock.ai'],
          subject: `Data Deletion Request: ${email.trim().slice(0, 60)}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #EF4444; margin-bottom: 24px;">Data Deletion Request</h2>
              <p style="color: #333; font-size: 15px; line-height: 1.6;">
                A user has requested deletion of all data associated with their account.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px 0; color: #888; width: 120px;">Email</td>
                  <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(email.trim())}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888;">Requested</td>
                  <td style="padding: 8px 0;">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888;">Deadline</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #EF4444;">${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                </tr>
              </table>
              <p style="color: #888; font-size: 13px;">
                Action required: Delete all user data within 30 days and send confirmation email.
              </p>
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
              <p style="color: #888; font-size: 12px;">Lumnix Data Deletion · Automated notification</p>
            </div>
          `,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
