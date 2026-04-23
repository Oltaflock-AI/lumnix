// Meta Ad Library API token resolution.
//
// The Ad Library API (graph.facebook.com/v*/ads_archive) in practice only
// accepts USER tokens unless the app owner has completed Meta identity
// verification, accepted the Ad Library API ToS, and been assigned an app
// role. Without that, app access tokens return OAuthException code 10
// subcode 2332004 "App role required".
//
// Resolution order:
//   1. META_ACCESS_TOKEN (user token, 60d when long-lived) — preferred,
//      since it is the only token that reliably works without app-level
//      Meta verification.
//   2. META_APP_ID|META_APP_SECRET (app access token) — fallback, works
//      only if the Meta app is verified + ToS accepted.
//
// Refresh the user token every ~45 days via tools/refresh_meta_app_token.mjs
// and paste the output into Vercel env → META_ACCESS_TOKEN.

export type MetaTokenSource = 'app_access_token' | 'user_access_token' | 'none';

export interface MetaTokenInfo {
  token: string | null;
  source: MetaTokenSource;
}

export function getMetaAdLibraryToken(): string | null {
  return getMetaAdLibraryTokenInfo().token;
}

export function getMetaAdLibraryTokenInfo(): MetaTokenInfo {
  const userToken = process.env.META_ACCESS_TOKEN?.trim();
  if (userToken) {
    return { token: userToken, source: 'user_access_token' };
  }

  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (appId && appSecret) {
    return { token: `${appId}|${appSecret}`, source: 'app_access_token' };
  }

  return { token: null, source: 'none' };
}
