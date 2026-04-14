'use client';

import { useTheme } from '@/lib/theme';

export type StatusType = 'active' | 'paused' | 'error' | 'connected' | 'disconnected' | 'syncing' | 'pending';

const statusConfig: Record<StatusType, {
  bg: string; darkBg: string;
  text: string; darkText: string;
  border: string; darkBorder: string;
  dotColor: string; label: string;
  animate?: 'pulse' | 'spin';
}> = {
  active:       { bg: '#ECFDF5', darkBg: 'rgba(5,150,105,0.15)',   text: '#065F46', darkText: '#6EE7B7', border: '#A7F3D0', darkBorder: 'rgba(5,150,105,0.3)',   dotColor: '#059669', label: 'Active',       animate: 'pulse' },
  paused:       { bg: '#FFFBEB', darkBg: 'rgba(245,158,11,0.12)', text: '#92400E', darkText: '#FCD34D', border: '#FDE68A', darkBorder: 'rgba(245,158,11,0.25)', dotColor: '#D97706', label: 'Paused' },
  error:        { bg: '#FEF2F2', darkBg: 'rgba(220,38,38,0.12)',  text: '#991B1B', darkText: '#FCA5A5', border: '#FECACA', darkBorder: 'rgba(220,38,38,0.25)',  dotColor: '#DC2626', label: 'Error',        animate: 'pulse' },
  connected:    { bg: '#ECFDF5', darkBg: 'rgba(5,150,105,0.15)',   text: '#065F46', darkText: '#6EE7B7', border: '#A7F3D0', darkBorder: 'rgba(5,150,105,0.3)',   dotColor: '#059669', label: 'Connected',    animate: 'pulse' },
  disconnected: { bg: '#F7F6FE', darkBg: 'rgba(139,92,246,0.08)', text: '#7C7AAA', darkText: '#8B88B8', border: '#E4E2F4', darkBorder: 'rgba(139,92,246,0.12)', dotColor: '#8B88B8', label: 'Disconnected' },
  syncing:      { bg: '#EDE9FF', darkBg: 'rgba(124,58,237,0.12)', text: '#5B21B6', darkText: '#C4B5FD', border: '#DDD8FF', darkBorder: 'rgba(124,58,237,0.25)', dotColor: '#7C3AED', label: 'Syncing',      animate: 'spin' },
  pending:      { bg: '#F7F6FE', darkBg: 'rgba(139,92,246,0.06)', text: '#7C7AAA', darkText: '#8B88B8', border: '#E4E2F4', darkBorder: 'rgba(139,92,246,0.08)', dotColor: '#8B88B8', label: 'Pending' },
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

  const normalized: StatusType = AD_STATUS_MAP[status] || (status as StatusType);
  const config = statusConfig[normalized] || statusConfig.pending;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 20,
        border: `1px solid ${isDark ? config.darkBorder : config.border}`,
        background: isDark ? config.darkBg : config.bg,
        color: isDark ? config.darkText : config.text,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Animated dot indicator */}
      <span style={{
        position: 'relative',
        width: 6,
        height: 6,
        flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          backgroundColor: config.dotColor,
          ...(config.animate === 'spin' ? {
            animation: 'spin 1.2s linear infinite',
            borderRadius: '50%',
            border: `1.5px solid ${config.dotColor}`,
            borderTopColor: 'transparent',
            backgroundColor: 'transparent',
            width: 6,
            height: 6,
          } : {}),
        }} />
        {config.animate === 'pulse' && (
          <span style={{
            position: 'absolute',
            inset: -2,
            borderRadius: '50%',
            backgroundColor: config.dotColor,
            opacity: 0.3,
            animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
          }} />
        )}
      </span>
      {label || config.label}
    </span>
  );
}
