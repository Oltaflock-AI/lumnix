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
            <Icon size={18} color={c.accent} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: c.text, letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>{title}</h1>
              {badge && (
                <Badge variant="outline" className="text-[9px] font-bold tracking-wider uppercase border-[rgba(255,97,84,0.3)] text-[var(--accent)] bg-[rgba(255,97,84,0.08)]">
                  {badge}
                </Badge>
              )}
            </div>
            <p style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.6 }}>{description}</p>
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
  const { c } = useTheme();
  return (
    <div className="card-hero" style={{ backgroundColor: c.bgCard, borderRadius: 14, padding: '60px 40px', textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg, rgba(255,97,84,0.12) 0%, rgba(34,211,238,0.08) 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '1px solid rgba(255,97,84,0.18)', boxShadow: '0 0 20px rgba(255,97,84,0.08)' }}>
        <Icon size={26} color={c.accent} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 8, letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>{title}</h3>
      <p style={{ fontSize: 13, color: c.textMuted, maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.6 }}>{description}</p>
      {actionLabel && onAction && (
        <Button variant="gradient" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/* ── Skeleton Presets ── */
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-5">
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
    <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-5">
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
    <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-[var(--bg-elevated)]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-4 p-4 border-b border-[var(--bg-elevated)] last:border-0">
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
