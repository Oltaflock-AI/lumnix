'use client';
import { type LucideIcon } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function PageShell({ title, description, icon: Icon, badge, action, children }: {
  title: string; description: string; icon: LucideIcon; badge?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  const { c } = useTheme();
  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#FAFAFA', letterSpacing: '-0.02em' }}>{title}</h1>
            {badge && <span style={{ fontSize: 10, fontWeight: 600, color: '#6366F1', backgroundColor: 'rgba(99,102,241,0.08)', padding: '3px 8px', borderRadius: 100, letterSpacing: '0.02em' }}>{badge}</span>}
          </div>
          <p style={{ fontSize: 13, color: '#555555', lineHeight: 1.6 }}>{description}</p>
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
  return (
    <div style={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: 12, padding: '60px 40px', textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={22} color="#6366F1" />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#FAFAFA', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 13, color: '#555555', maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.6 }}>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#6366F1', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
