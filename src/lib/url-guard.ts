// SSRF / open-redirect guards for user-supplied URLs.

const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT
  /^198\.(1[89])\./,
  /^224\./,
  /^240\./,
  /^255\.255\.255\.255$/,
];

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal')) return true;
  // IPv6 loopback / link-local / unique-local / unspecified
  if (h === '::1' || h === '::' || h.startsWith('fe80') || h.startsWith('fc') || h.startsWith('fd')) return true;
  // IPv4 literal
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
    return PRIVATE_V4.some((r) => r.test(h));
  }
  return false;
}

/**
 * Validate a user-supplied URL for server-side fetch. Returns a trusted URL or null.
 * Blocks: non-http(s) schemes, private/loopback/link-local IPs, cloud metadata endpoints.
 */
export function safeFetchUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (isPrivateHost(url.hostname)) return null;
  // GCP/AWS/Azure metadata
  if (url.hostname === 'metadata.google.internal') return null;
  return url;
}

/**
 * Validate a post-auth / post-OAuth redirect target. Accepts only same-origin
 * relative paths. Rejects protocol-relative (//evil.com), absolute, and control chars.
 */
export function safeRelativeRedirect(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (typeof raw !== 'string' || !raw) return fallback;
  if (!raw.startsWith('/')) return fallback;
  if (raw.startsWith('//')) return fallback;
  if (raw.startsWith('/\\')) return fallback;
  if (/[\r\n\t]/.test(raw)) return fallback;
  return raw;
}
