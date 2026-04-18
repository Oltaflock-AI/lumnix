import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { signState, parseState } from '@/lib/oauth-state';

// Note: `verifyState` is now async and consumes the nonce via a Supabase
// insert (single-use replay protection). That path needs a live DB and is
// covered by integration tests. Unit tests here target `parseState`, which
// validates signature + TTL + shape without touching storage.

const ORIGINAL_SECRET = process.env.OAUTH_STATE_SECRET;

beforeAll(() => {
  process.env.OAUTH_STATE_SECRET = 'test-secret-do-not-use-in-prod-' + Math.random();
});

afterAll(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.OAUTH_STATE_SECRET;
  else process.env.OAUTH_STATE_SECRET = ORIGINAL_SECRET;
});

describe('oauth-state', () => {
  const payload = { provider: 'google', workspace_id: 'ws_1', user_id: 'u_1' };

  it('round-trips a signed state', () => {
    const signed = signState(payload);
    const parsed = parseState(signed);
    expect(parsed).not.toBeNull();
    expect(parsed?.provider).toBe('google');
    expect(parsed?.workspace_id).toBe('ws_1');
    expect(parsed?.user_id).toBe('u_1');
  });

  it('rejects a tampered payload', () => {
    const signed = signState(payload);
    const [, sig] = signed.split('.');
    const tampered = Buffer.from(JSON.stringify({ ...payload, workspace_id: 'ws_evil', nonce: 'x', issued_at: Date.now() })).toString('base64url');
    expect(parseState(`${tampered}.${sig}`)).toBeNull();
  });

  it('rejects a tampered signature', () => {
    const signed = signState(payload);
    const [b64] = signed.split('.');
    expect(parseState(`${b64}.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`)).toBeNull();
  });

  it('rejects an expired state', () => {
    const signed = signState(payload);
    expect(parseState(signed, -1)).toBeNull();
  });

  it('rejects garbage input', () => {
    expect(parseState('not-a-token')).toBeNull();
    expect(parseState('')).toBeNull();
    expect(parseState('a.b.c')).toBeNull();
  });
});
