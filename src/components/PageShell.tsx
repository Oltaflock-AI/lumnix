'use client';
import { useEffect, useRef } from 'react';
import { type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const children = el.querySelectorAll('.reveal-on-scroll');
    if (children.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '-40px' }
    );
    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function PageShell({
  title,
  titleAccent,
  description,
  badge,
  action,
  children,
  // Deprecated — kept for backwards compatibility but no longer rendered
  icon: _icon,
}: {
  title?: string;
  titleAccent?: string;
  description?: string;
  badge?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  icon?: LucideIcon;
}) {
  const scrollRef = useScrollReveal();
  const showHeader = Boolean(title || titleAccent || description || action);
  return (
    <div ref={scrollRef} className="page-enter" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {showHeader && (
        <div
          className="lx-welcome fade-in"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              {(title || titleAccent) && (
                <h1>
                  {title}
                  {title && titleAccent ? ' ' : ''}
                  {titleAccent && <span>{titleAccent}</span>}
                </h1>
              )}
              {description && (
                <div className="lx-welcome-sub">
                  <span className="lx-welcome-dot" />
                  {description}
                </div>
              )}
            </div>
            {badge && (
              <span
                style={{
                  alignSelf: 'flex-start',
                  marginTop: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                  background: 'var(--primary-glow)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontFamily: 'var(--font-body)',
                }}
              >
                {badge}
              </span>
            )}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: {
  icon: LucideIcon; title: string; description: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 32px', textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 16,
        background: 'var(--primary-glow)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <Icon size={32} color="var(--color-accent)" />
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>
        {title}
      </h2>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.6, marginBottom: 24 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="lx-btn-primary"
          style={{ padding: '10px 20px', fontSize: 14 }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ── Skeleton Presets ── */
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border-strong)] p-5" style={{ backgroundColor: "var(--bg-surface)" }}>
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-28 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="kpi-grid">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-[var(--border-strong)] p-5" style={{ backgroundColor: "var(--bg-surface)" }}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>
      <Skeleton className="w-full rounded-lg" style={{ height }} />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-[var(--border-strong)] overflow-hidden" style={{ backgroundColor: "var(--bg-surface)" }}>
      <div className="flex gap-4 p-4 border-b" style={{ borderColor: "var(--bg-elevated)" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-4 p-4 border-b last:border-0" style={{ borderColor: "var(--bg-elevated)" }}>
          {Array.from({ length: cols }).map((_, ci) => (
            <Skeleton key={ci} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div>
      <div className="flex items-start gap-4 mb-7">
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <KpiGridSkeleton />
      <div className="two-col-equal">
        <ChartSkeleton />
        <ChartSkeleton height={200} />
      </div>
    </div>
  );
}
