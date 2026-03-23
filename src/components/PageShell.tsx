'use client';
import { type LucideIcon } from 'lucide-react';

export function PageShell({ title, description, icon: Icon, badge, action, children }: {
  title: string; description: string; icon: LucideIcon; badge?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={22} color="#a78bfa" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.5px' }}>{title}</h1>
              {badge && <span style={{ fontSize: '10px', fontWeight: 600, color: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.15)', padding: '2px 8px', borderRadius: '4px' }}>{badge}</span>}
            </div>
            <p style={{ fontSize: '14px', color: '#71717a', marginTop: '2px' }}>{description}</p>
          </div>
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
    <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '60px 40px', textAlign: 'center' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.15))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        <Icon size={28} color="#a78bfa" />
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f4f4f5', marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: '#71717a', maxWidth: '400px', margin: '0 auto 20px', lineHeight: 1.6 }}>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
