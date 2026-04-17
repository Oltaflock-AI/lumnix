import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { signUnsubscribeToken, verifyUnsubscribeToken } from '@/lib/email-tokens';

const ORIGINAL_SECRET = process.env.OAUTH_STATE_SECRET;

beforeAll(() => {
  process.env.OAUTH_STATE_SECRET = 'test-secret-email-tokens-' + Math.random();
});

afterAll(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.OAUTH_STATE_SECRET;
  else process.env.OAUTH_STATE_SECRET = ORIGINAL_SECRET;
});

describe('email-tokens (unsubscribe)', () => {
  it('round-trips a signed unsubscribe token', () => {
    const token = signUnsubscribeToken('user_123');
    expect(verifyUnsubscribeToken(token)).toBe('user_123');
  });

  it('rejects a tampered payload with re-used signature', () => {
    const token = signUnsubscribeToken('user_victim');
    const [, sig] = token.split('.');
    const evilPayload = Buffer.from(JSON.stringify({ user_id: 'user_attacker', issued_at: Date.now() })).toString('base64url');
    expect(verifyUnsubscribeToken(`${evilPayload}.${sig}`)).toBeNull();
  });

  it('rejects a malformed token', () => {
    expect(verifyUnsubscribeToken('')).toBeNull();
    expect(verifyUnsubscribeToken('no-dot')).toBeNull();
    expect(verifyUnsubscribeToken('a.')).toBeNull();
    expect(verifyUnsubscribeToken('.b')).toBeNull();
  });

  it('different user_id produces different tokens', () => {
    const a = signUnsubscribeToken('u_1');
    const b = signUnsubscribeToken('u_2');
    expect(a).not.toBe(b);
    expect(verifyUnsubscribeToken(a)).toBe('u_1');
    expect(verifyUnsubscribeToken(b)).toBe('u_2');
  });
});
