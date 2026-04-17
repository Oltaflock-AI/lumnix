import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { signState, verifyState } from '@/lib/oauth-state';

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
    const verified = verifyState(signed);
    expect(verified).not.toBeNull();
    expect(verified?.provider).toBe('google');
    expect(verified?.workspace_id).toBe('ws_1');
    expect(verified?.user_id).toBe('u_1');
  });

  it('rejects a tampered payload', () => {
    const signed = signState(payload);
    const [b64, sig] = signed.split('.');
    const tampered = Buffer.from(JSON.stringify({ ...payload, workspace_id: 'ws_evil', nonce: 'x', issued_at: Date.now() })).toString('base64url');
    expect(verifyState(`${tampered}.${sig}`)).toBeNull();
  });

  it('rejects a tampered signature', () => {
    const signed = signState(payload);
    const [b64] = signed.split('.');
    expect(verifyState(`${b64}.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`)).toBeNull();
  });

  it('rejects an expired state', () => {
    const signed = signState(payload);
    expect(verifyState(signed, -1)).toBeNull();
  });

  it('rejects garbage input', () => {
    expect(verifyState('not-a-token')).toBeNull();
    expect(verifyState('')).toBeNull();
    expect(verifyState('a.b.c')).toBeNull();
  });
});
