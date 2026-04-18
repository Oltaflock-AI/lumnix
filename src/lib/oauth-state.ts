import crypto from 'crypto';
import { getSupabaseAdmin } from './supabase-admin';

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

/**
 * Validate signature + TTL + payload shape. Does NOT consume the nonce, so
 * this can be called multiple times on the same state. Use `verifyState` on
 * the OAuth callback itself (it additionally enforces single-use).
 */
export function parseState(signedState: string, maxAgeMs = 10 * 60 * 1000): OAuthState | null {
  const [stateB64, sig] = (signedState || '').split('.');
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
    if (!state.nonce || typeof state.nonce !== 'string') return null;
    return state;
  } catch {
    return null;
  }
}

/**
 * Verify + consume the state atomically. Returns the parsed state on first
 * use; returns null on replay, bad signature, expired token, or DB write
 * failure. The nonce row is written with a PK unique constraint so concurrent
 * callers race safely — only one wins.
 */
export async function verifyState(
  signedState: string,
  maxAgeMs = 10 * 60 * 1000,
): Promise<OAuthState | null> {
  const state = parseState(signedState, maxAgeMs);
  if (!state) return null;

  // Single-use enforcement: insert into oauth_nonces with nonce as PK.
  // Unique violation = replay → reject. Any other error → reject (fail-closed).
  const expiresAt = new Date(state.issued_at + maxAgeMs).toISOString();
  const { error } = await getSupabaseAdmin()
    .from('oauth_nonces')
    .insert({ nonce: state.nonce, expires_at: expiresAt });

  if (error) return null;
  return state;
}
