import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const key = `test-${Date.now()}-allow`;
    expect(rateLimit(key, 5, 60000)).toBeNull();
    expect(rateLimit(key, 5, 60000)).toBeNull();
    expect(rateLimit(key, 5, 60000)).toBeNull();
  });

  it('blocks requests over the limit', () => {
    const key = `test-${Date.now()}-block`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60000)).toBeNull();
    }
    const result = rateLimit(key, 3, 60000);
    expect(result).not.toBeNull();
    // Check it's a 429 response
    expect(result?.status).toBe(429);
  });

  it('uses separate limits for different keys', () => {
    const key1 = `test-${Date.now()}-a`;
    const key2 = `test-${Date.now()}-b`;

    expect(rateLimit(key1, 1, 60000)).toBeNull();
    expect(rateLimit(key1, 1, 60000)).not.toBeNull();

    // key2 should still be allowed
    expect(rateLimit(key2, 1, 60000)).toBeNull();
  });

  it('resets after window expires', async () => {
    const key = `test-${Date.now()}-expire`;
    expect(rateLimit(key, 1, 50)).toBeNull(); // windowMs = 50ms
    expect(rateLimit(key, 1, 50)).not.toBeNull();

    await new Promise(resolve => setTimeout(resolve, 60));
    expect(rateLimit(key, 1, 50)).toBeNull();
  });
});
