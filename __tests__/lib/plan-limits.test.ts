import { describe, it, expect } from 'vitest';
import { getLimitsForPlan } from '@/lib/plan-limits';

describe('getLimitsForPlan', () => {
  it('returns free tier limits by default', () => {
    const limits = getLimitsForPlan('free');
    expect(limits.competitors).toBe(2);
    expect(limits.teamMembers).toBe(2);
    expect(limits.integrations).toBe(2);
    expect(limits.aiChatsPerDay).toBe(10);
  });

  it('returns pro tier limits', () => {
    const limits = getLimitsForPlan('pro');
    expect(limits.competitors).toBe(10);
    expect(limits.teamMembers).toBe(10);
    expect(limits.integrations).toBe(4);
    expect(limits.aiChatsPerDay).toBe(100);
  });

  it('returns enterprise tier with unlimited access', () => {
    const limits = getLimitsForPlan('enterprise');
    expect(limits.competitors).toBe(Infinity);
    expect(limits.teamMembers).toBe(Infinity);
    expect(limits.integrations).toBe(Infinity);
    expect(limits.aiChatsPerDay).toBe(Infinity);
  });

  it('falls back to free tier for unknown plans', () => {
    const limits = getLimitsForPlan('unknown');
    expect(limits.competitors).toBe(2);
    expect(limits.teamMembers).toBe(2);
  });
});
