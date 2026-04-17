import crypto from 'crypto';

/**
 * HMAC-signed opt-out tokens for marketing email unsubscribe links.
 *
 * Why: the previous implementation took `user_id` from the URL at face value,
 * so any attacker could iterate UUIDs and opt-out every user from marketing
 * email. Signed tokens tie the link to the specific user the email was sent to.
 */

function getSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) throw new Error('OAUTH_STATE_SECRET required for email token signing');
  return secret;
}

interface UnsubscribePayload {
  user_id: string;
  issued_at: number;
}

export function signUnsubscribeToken(userId: string): string {
  const payload: UnsubscribePayload = { user_id: userId, issued_at: Date.now() };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [b64, sig] = (token || '').split('.');
  if (!b64 || !sig) return null;

  const expected = crypto.createHmac('sha256', getSecret()).update(b64).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const payload: UnsubscribePayload = JSON.parse(Buffer.from(b64, 'base64url').toString());
    if (!payload.user_id || typeof payload.user_id !== 'string') return null;
    // No hard expiry — emails may be opened years later. Only care about authenticity.
    return payload.user_id;
  } catch {
    return null;
  }
}
