'use client';

import { useTheme } from '@/lib/theme';

export type StatusType = 'active' | 'paused' | 'error' | 'connected' | 'disconnected' | 'syncing' | 'pending';

const statusConfig: Record<StatusType, {
  bg: string; darkBg: string;
  text: string; darkText: string;
  border: string; darkBorder: string;
  icon: string; label: string;
}> = {
  active:       { bg: '#ECFDF5', darkBg: 'rgba(5,150,105,0.2)',   text: '#065F46', darkText: '#6EE7B7', border: '#A7F3D0', darkBorder: 'rgba(5,150,105,0.4)',   icon: '●', label: 'Active' },
  paused:       { bg: '#FFFBEB', darkBg: 'rgba(245,158,11,0.15)', text: '#92400E', darkText: '#FCD34D', border: '#FDE68A', darkBorder: 'rgba(245,158,11,0.3)', icon: '⏸', label: 'Paused' },
  error:        { bg: '#FEF2F2', darkBg: 'rgba(220,38,38,0.15)',  text: '#991B1B', darkText: '#FCA5A5', border: '#FECACA', darkBorder: 'rgba(220,38,38,0.3)',  icon: '✕', label: 'Error' },
  connected:    { bg: '#ECFDF5', darkBg: 'rgba(5,150,105,0.2)',   text: '#065F46', darkText: '#6EE7B7', border: '#A7F3D0', darkBorder: 'rgba(5,150,105,0.4)',   icon: '●', label: 'Connected' },
  disconnected: { bg: '#F8FAFC', darkBg: 'rgba(100,116,139,0.15)',text: '#64748B', darkText: '#94A3B8', border: '#E2E8F0', darkBorder: 'rgba(255,255,255,0.1)', icon: '○', label: 'Disconnected' },
  syncing:      { bg: '#EDE9FF', darkBg: 'rgba(124,58,237,0.15)', text: '#5B21B6', darkText: '#C4B5FD', border: '#DDD8FF', darkBorder: 'rgba(124,58,237,0.3)', icon: '↻', label: 'Syncing' },
  pending:      { bg: '#F8FAFC', darkBg: 'rgba(148,163,184,0.12)',text: '#94A3B8', darkText: '#94A3B8', border: '#E2E8F0', darkBorder: 'rgba(255,255,255,0.08)',icon: '○', label: 'Pending' },
};

/** Map Google Ads API statuses to our standard types */
const AD_STATUS_MAP: Record<string, StatusType> = {
  ENABLED: 'active',
  PAUSED: 'paused',
  REMOVED: 'error',
};

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Normalize Google Ads statuses
  const normalized: StatusType = AD_STATUS_MAP[status] || (status as StatusType);
  const config = statusConfig[normalized] || statusConfig.pending;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 9px',
        borderRadius: 20,
        border: `1px solid ${isDark ? config.darkBorder : config.border}`,
        background: isDark ? config.darkBg : config.bg,
        color: isDark ? config.darkText : config.text,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 9 }}>{config.icon}</span>
      {label || config.label}
    </span>
  );
}
