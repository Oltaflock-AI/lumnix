import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    // Middleware already validated the session and sets these headers
    // on the forwarded request (and strips any client-supplied copies).
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Rate-limit by the authenticated user, not by a spoofable IP header.
    const limited = rateLimit(`feedback:${userId}`, 10, 60 * 60 * 1000);
    if (limited) return limited;

    const rawEmail = req.headers.get('x-user-email') || '';
    const userEmail = EMAIL_RE.test(rawEmail) ? rawEmail : 'unknown';
    const { message, workspace_id, workspace_name } = await req.json();

    const trimmed = (message || '').toString().trim();
    if (!trimmed) return NextResponse.json({ error: 'Message required' }, { status: 400 });
    if (trimmed.length > 4000) return NextResponse.json({ error: 'Message too long' }, { status: 400 });

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Lumnix <notifications@oltaflock.ai>',
          to: ['admin@oltaflock.ai'],
          reply_to: userEmail !== 'unknown' ? userEmail : undefined,
          subject: `💬 Feedback — ${workspace_name || 'Lumnix'}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #7C3AED; margin: 0 0 16px;">New product feedback</h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                <tr><td style="padding: 6px 0; color: #888; width: 110px;">From</td><td style="padding: 6px 0;">${escape(userEmail)}</td></tr>
                <tr><td style="padding: 6px 0; color: #888;">Workspace</td><td style="padding: 6px 0;">${escape(workspace_name || '—')} <span style="color:#aaa">(${escape(workspace_id || '—')})</span></td></tr>
                <tr><td style="padding: 6px 0; color: #888;">User ID</td><td style="padding: 6px 0;">${escape(userId)}</td></tr>
              </table>
              <div style="padding: 16px 18px; background: #F7F6FE; border-left: 3px solid #7C3AED; border-radius: 4px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escape(trimmed)}</div>
            </div>`,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Could not send feedback' }, { status: 500 });
  }
}
