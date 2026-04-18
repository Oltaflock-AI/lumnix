// Google OAuth 2.0 helpers for GSC, GA4, Google Ads

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

export function getGoogleAuthUrl(redirectUri: string, scopes: string[], state: string) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  return res.json();
}

/**
 * Best-effort Google token revoke. Fire-and-forget; callers must swallow errors.
 * Google returns 200 on success, 400 for already-revoked / invalid tokens —
 * treat any response as terminal.
 */
export async function revokeGoogleToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  return res.json();
}

// Scopes per provider
export const SCOPES = {
  gsc: ['https://www.googleapis.com/auth/webmasters.readonly'],
  ga4: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics',
  ],
  google_ads: [
    'https://www.googleapis.com/auth/adwords',
  ],
};
