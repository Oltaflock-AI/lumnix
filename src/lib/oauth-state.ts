import crypto from 'crypto';

function getSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) throw new Error('OAUTH_STATE_SECRET required for OAuth state signing');
  return secret;
}

export interface OAuthState {
  provider: string;
  workspace_id: string;
  user_id: string;
  return_to?: string;
  nonce: string;
  issued_at: number;
}

export function signState(payload: Omit<OAuthState, 'nonce' | 'issued_at'>): string {
  const state: OAuthState = {
    ...payload,
    nonce: crypto.randomBytes(16).toString('hex'),
    issued_at: Date.now(),
  };
  const stateJson = JSON.stringify(state);
  const stateB64 = Buffer.from(stateJson).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(stateB64).digest('base64url');
  return `${stateB64}.${sig}`;
}

export function verifyState(signedState: string, maxAgeMs = 10 * 60 * 1000): OAuthState | null {
  const [stateB64, sig] = signedState.split('.');
  if (!stateB64 || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', getSecret()).update(stateB64).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  } catch {
    return null;
  }

  try {
    const state: OAuthState = JSON.parse(Buffer.from(stateB64, 'base64url').toString());
    if (!state.issued_at || Date.now() - state.issued_at > maxAgeMs) return null;
    if (!state.provider || !state.workspace_id || !state.user_id) return null;
    return state;
  } catch {
    return null;
  }
}
