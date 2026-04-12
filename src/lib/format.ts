/**
 * Shared number formatting utilities — en-IN locale throughout.
 */

/** Format a number using Indian locale (e.g. 3,14,735) */
export function formatNumber(v: number): string {
  return new Intl.NumberFormat('en-IN').format(v);
}

/** Format currency in INR with Indian locale (e.g. ₹3,14,735) */
export function formatINR(v: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(v);
}

/** Format currency in compact form (e.g. ₹3.1k) */
export function formatINRCompact(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  return `₹${v.toFixed(0)}`;
}

/** Format ROAS — show '—' when no revenue data */
export function formatROAS(roas: number | null | undefined, hasRevenue: boolean): string {
  if (!hasRevenue || roas == null || roas === 0) return '—';
  return `${roas.toFixed(2)}x`;
}
