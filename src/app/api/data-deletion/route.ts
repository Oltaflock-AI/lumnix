import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { escapeHtml } from '@/lib/html-escape';

// ─── Token helpers (HMAC-signed, 24h TTL) ───────────────────────────────────
const CONFIRM_TTL_MS = 24 * 60 * 60 * 1000;

function getTokenSecret(): string {
  const s = process.env.OAUTH_STATE_SECRET;
  if (!s) throw new Error('OAUTH_STATE_SECRET required for data-deletion token signing');
  return s;
}

function signConfirmToken(email: string): string {
  const payload = { email, issued_at: Date.now() };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getTokenSecret()).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function verifyConfirmToken(token: string): string | null {
  const [b64, sig] = (token || '').split('.');
  if (!b64 || !sig) return null;
  const expected = crypto.createHmac('sha256', getTokenSecret()).update(b64).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload: { email: string; issued_at: number } = JSON.parse(
      Buffer.from(b64, 'base64url').toString()
    );
    if (!payload.email || !payload.issued_at) return null;
    if (Date.now() - payload.issued_at > CONFIRM_TTL_MS) return null;
    return payload.email;
  } catch {
    return null;
  }
}

// ─── Meta signed_request verification ───────────────────────────────────────
// Per https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback/
function verifyMetaSignedRequest(signedRequest: string): { user_id?: string } | null {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signedRequest) return null;
  const [encodedSig, payload] = signedRequest.split('.', 2);
  if (!encodedSig || !payload) return null;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(encodedSig, 'base64url');
  } catch {
    return null;
  }
  if (actual.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(actual, expected)) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return null;
  }
}

// ─── Admin notification ─────────────────────────────────────────────────────
async function notifyAdmin(
  email: string,
  source: 'user_confirmation' | 'meta_webhook',
  ref?: string,
) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;
  const safeEmail = escapeHtml(email);
  const safeRef = escapeHtml(ref || '');
  const subjectRef = ref ? ` [${ref.slice(0, 20)}]` : '';
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Lumnix <notifications@oltaflock.ai>',
      to: ['admin@oltaflock.ai'],
      subject: `Data Deletion Request${subjectRef}: ${email.slice(0, 60)}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #EF4444; margin-bottom: 24px;">Data Deletion Request (verified)</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            A data-deletion request has been verified and is ready to process.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px 0; color: #888; width: 120px;">Email</td>
                <td style="padding: 8px 0; font-weight: 600;">${safeEmail}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Source</td>
                <td style="padding: 8px 0;">${escapeHtml(source)}</td></tr>
            ${ref ? `<tr><td style="padding: 8px 0; color: #888;">Ref</td>
                <td style="padding: 8px 0;">${safeRef}</td></tr>` : ''}
            <tr><td style="padding: 8px 0; color: #888;">Deadline</td>
                <td style="padding: 8px 0; font-weight: 600; color: #EF4444;">${new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td></tr>
          </table>
          <p style="color: #888; font-size: 13px;">
            Action required: delete all user data within 30 days and send confirmation email.
          </p>
        </div>
      `,
    }),
  });
}

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

// ─── POST: dual handler (user request OR Meta webhook) ──────────────────────
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';

  // Meta sends signed_request as x-www-form-urlencoded
  if (contentType.includes('application/x-www-form-urlencoded')) {
    try {
      const form = await req.formData();
      const signedRequest = String(form.get('signed_request') || '');
      const payload = verifyMetaSignedRequest(signedRequest);
      if (!payload || !payload.user_id) {
        return NextResponse.json({ error: 'Invalid signed_request' }, { status: 401 });
      }

      const confirmationCode = `meta_${crypto.randomBytes(12).toString('hex')}`;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      await notifyAdmin(`meta_user:${payload.user_id}`, 'meta_webhook', confirmationCode);

      return NextResponse.json({
        url: `${appUrl}/data-deletion?ref=${confirmationCode}`,
        confirmation_code: confirmationCode,
      });
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
  }

  // User-initiated request: send confirmation link to the requester's mailbox.
  // Admin is NOT notified at this stage — stops anyone from flooding the admin
  // inbox with arbitrary email addresses.
  try {
    const ip = getIp(req);
    const rateLimited = rateLimit(`data-deletion:send:${ip}`, 3, 60 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const { email } = await req.json();
    const trimmed = String(email || '').trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const token = signConfirmToken(trimmed);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const confirmUrl = `${appUrl}/api/data-deletion?confirm=${encodeURIComponent(token)}`;

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Lumnix <notifications@oltaflock.ai>',
          to: [trimmed],
          subject: 'Confirm your Lumnix data deletion request',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #111; margin-bottom: 16px;">Confirm data deletion</h2>
              <p style="color: #333; font-size: 15px; line-height: 1.6;">
                Someone (hopefully you) requested deletion of all Lumnix data associated with <strong>${escapeHtml(trimmed)}</strong>.
              </p>
              <p style="color: #333; font-size: 15px; line-height: 1.6;">
                Click the button below within 24 hours to confirm. If you did not request this, ignore this email — no action will be taken.
              </p>
              <p style="margin: 28px 0;">
                <a href="${escapeHtml(confirmUrl)}"
                   style="display: inline-block; padding: 12px 24px; background: #EF4444; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Confirm deletion
                </a>
              </p>
              <p style="color: #888; font-size: 12px; line-height: 1.6;">
                Link expires in 24 hours. If the button does not work, copy this URL into your browser:<br />
                <span style="word-break: break-all;">${escapeHtml(confirmUrl)}</span>
              </p>
            </div>
          `,
        }),
      });
    }

    // Always return the same shape regardless of outcome; do not reveal
    // whether the email maps to a real account.
    return NextResponse.json({ success: true, confirmation_sent: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// ─── GET: confirm link from the requester's mailbox ─────────────────────────
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('confirm');
  const ip = getIp(req);

  const rateLimited = rateLimit(`data-deletion:confirm:${ip}`, 30, 60 * 60 * 1000);
  if (rateLimited) return rateLimited;

  if (!token) {
    return NextResponse.json({ status: 'ok' });
  }

  const email = verifyConfirmToken(token);
  if (!email) {
    return new NextResponse(
      `<!doctype html><meta charset="utf-8"><title>Link expired</title>
       <div style="font-family:sans-serif;max-width:520px;margin:80px auto;padding:24px;text-align:center">
         <h1 style="color:#EF4444">Link expired or invalid</h1>
         <p>Start again from <a href="/data-deletion">the data deletion page</a>.</p>
       </div>`,
      { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  }

  await notifyAdmin(email, 'user_confirmation');

  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>Request confirmed</title>
     <div style="font-family:sans-serif;max-width:520px;margin:80px auto;padding:24px;text-align:center">
       <h1 style="color:#111">Deletion confirmed</h1>
       <p>We received your verified request for <strong>${escapeHtml(email)}</strong>. All data will be deleted within 30 days, and we'll email you when it's done.</p>
       <p><a href="/">← Back to Lumnix</a></p>
     </div>`,
    { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}
