'use client';
import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, onCancel, onConfirm,
}: ConfirmDialogProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); return; }
      if (e.key !== 'Tab') return;
      const focusable = ref.current?.querySelectorAll<HTMLElement>('button');
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={description ? 'confirm-desc' : undefined}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 380, padding: 22, borderRadius: 14,
          background: isDark ? '#1E293B' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {danger && (
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={18} color="#EF4444" />
            </div>
          )}
          <h3 id="confirm-title" style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h3>
        </div>
        {description && (
          <p id="confirm-desc" style={{ fontSize: 13, color: isDark ? '#94A3B8' : '#6B7280', marginBottom: 20, lineHeight: 1.5 }}>{description}</p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onCancel}
            autoFocus
            style={{ padding: '8px 16px', borderRadius: 8, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0', background: 'transparent', color: isDark ? '#CBD5E1' : '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >{cancelLabel}</button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: danger ? '1px solid #FECACA' : 'none',
              background: danger ? 'transparent' : 'var(--accent)',
              color: danger ? '#EF4444' : '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
