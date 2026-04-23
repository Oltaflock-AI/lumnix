// Meta OAuth helpers shared across sync routes.
//
// Meta issues two kinds of user tokens:
//   - Short-lived: 1-2 hours (what Graph API Explorer hands out by default)
//   - Long-lived:  60 days (from POST /oauth/access_token with grant_type=fb_exchange_token)
//
// Long-lived tokens CAN be re-exchanged to get a fresh 60-day window, as long
// as you do it BEFORE the current token expires. That's the whole point of
// refreshAccessToken below — if you call it every ~30-45 days, the user never
// has to reconnect Meta manually.

export interface MetaTokenExchangeResult {
  access_token: string;
  token_type?: string;
  expires_in?: number; // seconds
}

export interface MetaTokenRefreshError {
  error: {
    message: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
}

/**
 * Exchange a valid Meta user token (short OR long-lived) for a fresh
 * 60-day long-lived token. Works as long as the input token is still valid —
 * i.e., proactively BEFORE it expires.
 *
 * Throws on Meta error (OAuthException, etc.) so callers can decide whether
 * to mark the integration as 'error' or just log-and-retry.
 */
export async function exchangeForLongLivedToken(
  shortOrLongToken: string,
): Promise<MetaTokenExchangeResult> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('META_APP_ID and META_APP_SECRET must be set to refresh Meta tokens');
  }
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortOrLongToken,
  });
  const res = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params}`);
  const body = (await res.json()) as MetaTokenExchangeResult & Partial<MetaTokenRefreshError>;
  if ((body as MetaTokenRefreshError).error) {
    const e = (body as MetaTokenRefreshError).error;
    throw new Error(`Meta fb_exchange_token failed: ${e.message} (code=${e.code})`);
  }
  if (!body.access_token) {
    throw new Error('Meta fb_exchange_token returned no access_token');
  }
  return body;
}

/**
 * True if the token expires within `daysAhead` days — i.e., we should refresh
 * it now rather than wait for it to die. Default: 7 days.
 */
export function shouldRefreshMetaToken(
  expiresAt: string | null | undefined,
  daysAhead = 7,
): boolean {
  if (!expiresAt) return false; // null = treat as long-lived unknown; let sync try
  const expiryMs = new Date(expiresAt).getTime();
  if (isNaN(expiryMs)) return false;
  const refreshThresholdMs = Date.now() + daysAhead * 24 * 60 * 60 * 1000;
  return expiryMs < refreshThresholdMs;
}

/**
 * True if the token is already expired (or within the next 5 minutes).
 */
export function isMetaTokenExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const expiryMs = new Date(expiresAt).getTime();
  if (isNaN(expiryMs)) return false;
  return expiryMs < Date.now() + 5 * 60 * 1000;
}
