'use client';
import { type LucideIcon } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function PageShell({ title, description, icon: Icon, badge, action, children }: {
  title: string; description: string; icon: LucideIcon; badge?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  const { c } = useTheme();
  return (
    <div className="fade-in" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div className="icon-pill">
          <Icon size={18} color={c.accent} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: c.text, letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>{title}</h1>
            {badge && <span style={{ fontSize: 9, fontWeight: 700, color: c.accent, backgroundColor: c.accentSubtle, padding: '3px 10px', borderRadius: 100, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>{badge}</span>}
          </div>
          <p style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.6 }}>{description}</p>
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: {
  icon: LucideIcon; title: string; description: string; actionLabel?: string; onAction?: () => void;
}) {
  const { c } = useTheme();
  return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: '60px 40px', textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: c.accentSubtle, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={22} color={c.accent} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 8, letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>{title}</h3>
      <p style={{ fontSize: 13, color: c.textMuted, maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.6 }}>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: c.accent, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
