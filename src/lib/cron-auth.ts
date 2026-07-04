/**
 * Cron authentication helpers.
 *
 * Cron routes authenticate with a shared `CRON_SECRET` bearer token. The
 * comparison MUST be constant-time to avoid leaking the secret via response
 * timing. We use a pure-JS implementation (not `node:crypto`'s
 * `timingSafeEqual`) because that native binding breaks Turbopack/Edge
 * parsing — this mirrors the implementation in `src/middleware.ts`.
 */

/**
 * Constant-time string comparison. Returns true only when `a` and `b` are
 * equal. Comparison time depends only on `a.length`, not on where the strings
 * first differ.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Validates an inbound `Authorization` header against `CRON_SECRET` using a
 * constant-time compare. Returns false if `CRON_SECRET` is unset or the header
 * does not match `Bearer <secret>`.
 */
export function isValidCronAuth(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return timingSafeStringEqual(authHeader ?? '', `Bearer ${secret}`);
}
