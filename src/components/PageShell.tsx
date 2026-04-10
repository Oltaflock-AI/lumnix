'use client';
import { useEffect, useRef } from 'react';
import { type LucideIcon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

/**
 * Intersection Observer hook for scroll-triggered reveal animations.
 * Adds 'revealed' class when element enters viewport.
 */
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

export function PageShell({ title, description, icon: Icon, badge, action, children }: {
  title: string; description: string; icon: LucideIcon; badge?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  const { c } = useTheme();
  const scrollRef = useScrollReveal();
  return (
    <div ref={scrollRef} className="page-enter" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="fade-in" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div className="icon-pill scale-in">
            <Icon size={18} color="#7C3AED" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', fontFamily: "'Plus Jakarta Sans', var(--font-display), sans-serif" }}>{title}</h1>
              {badge && (
                <Badge variant="outline" className="text-[9px] font-bold tracking-wider uppercase border-[rgba(124,58,237,0.3)] text-[#7C3AED] bg-[rgba(124,58,237,0.08)]">
                  {badge}
                </Badge>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>{description}</p>
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 32px', textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 16,
        background: 'rgba(124,58,237,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <Icon size={32} color="#7C3AED" />
      </div>
      <h2 style={{ fontFamily: "'Plus Jakarta Sans', var(--font-display), sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>
        {title}
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.6, marginBottom: 24 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: '#7C3AED', color: '#FFFFFF',
            borderRadius: 8, border: 'none',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14,
            cursor: 'pointer', transition: 'background 150ms, box-shadow 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#6D28D9'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#7C3AED'; e.currentTarget.style.boxShadow = 'none'; }}
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
      {/* Header */}
      <div className="flex gap-4 p-4 border-b" style={{ borderColor: "var(--bg-elevated)" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
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
      {/* Header skeleton */}
      <div className="flex items-start gap-4 mb-7">
        <Skeleton className="h-9 w-9 rounded-[10px]" />
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
