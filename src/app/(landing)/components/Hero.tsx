'use client';

import { useId } from 'react';
import Link from 'next/link';
import { Trophy, Eye, TrendingUp, ArrowUpRight, BarChart3, Zap } from 'lucide-react';
import { IntelCard } from './IntelCard';
import { ScrollReveal } from './ScrollReveal';

/* Mini sparkline SVG — pure visual, no library needed */
function Sparkline({ color = '#7C3AED', data = [3,5,4,7,6,8,7,9,8,11,10,14,12,15] }: { color?: string; data?: number[] }) {
  const id = useId();
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 120, h = 32;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#spark-${id})`} />
      <polyline points={points} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="wr-section wr-hero">
      {/* Orbs */}
      <div className="wr-orb-1" />
      <div className="wr-orb-2" />

      <div className="wr-container wr-grid-2" style={{ alignItems: 'center' }}>
        {/* Copy — NO ScrollReveal on above-fold content */}
        <div>
          <span className="wr-badge">
            <span className="wr-pulse-dot" />
            Now in early access
          </span>

          <h1 className="wr-hero-headline" style={{ marginBottom: 28 }}>
            Your competitors
            <br />know something
            <br /><span className="wr-shimmer">you don&apos;t.</span>
          </h1>

          <p className="wr-sub-headline" style={{ marginBottom: 20, maxWidth: 540 }}>
            While you&apos;re switching between 5 dashboards,
            they&apos;re making decisions in <strong style={{ color: '#fff' }}>one.</strong>
          </p>
          <p className="wr-body-large" style={{ marginBottom: 36, maxWidth: 480 }}>
            Your team wastes <span className="wr-text-danger">14 hours/week</span> stitching data across tools that don&apos;t talk to each other.
          </p>
          <p className="wr-hero-tagline">
            Lumnix ends that. Today.
          </p>

          <div className="wr-hero-ctas">
            <Link href="/auth/signup" className="wr-cta wr-cta--lg">
              Get early access — it&apos;s free <span style={{ fontSize: 20 }}>→</span>
            </Link>
            <a href="#features" className="wr-cta-ghost">
              See how it works ↓
            </a>
          </div>
          <p className="wr-hero-savings">
            <span className="wr-text-danger">₹75,000/mo</span> in tools → replaced by <span className="wr-text-green">₹2,499/mo</span>
          </p>

          <div className="wr-hero-proof">
            <p className="wr-hero-proof-text">Join the waitlist — limited early access spots</p>
          </div>
        </div>

        {/* 3D Intel Card */}
        <ScrollReveal delay={0.2} className="flex justify-center">
          <IntelCard className="wr-float">
            <div className="wr-glass wr-intel-card">
              {/* Top KPI strip */}
              <div className="wr-kpi-strip">
                {[
                  { label: 'Sessions', value: '9,511', change: '+12%', color: '#34D399', data: [4,5,4,6,5,7,6,8,7,9,8,10,9,11] },
                  { label: 'Clicks', value: '214', change: '+8%', color: '#7C3AED', data: [2,3,2,4,3,5,4,5,4,6,5,6,5,7] },
                  { label: 'ROAS', value: '4.2x', change: '+23%', color: '#0891B2', data: [2,2,3,3,3,4,3,4,4,4,5,4,5,5] },
                ].map((kpi, i) => (
                  <div key={kpi.label} className="wr-kpi-cell" style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div className="wr-kpi-label">{kpi.label}</div>
                    <div className="wr-kpi-value-row">
                      <span className="wr-kpi-value">{kpi.value}</span>
                      <span className="wr-kpi-change" style={{ color: kpi.color }}>{kpi.change}</span>
                    </div>
                    <Sparkline color={kpi.color} data={kpi.data} />
                  </div>
                ))}
              </div>

              {/* Main card body */}
              <div className="wr-intel-body">
                <div className="wr-intel-header">
                  <span className="wr-label" style={{ fontSize: 10 }}>COMPETITOR INTEL</span>
                  <div className="wr-live-badge">
                    <span className="wr-pulse-dot" />
                    LIVE
                  </div>
                </div>

                <div className="wr-intel-competitor">
                  <div className="wr-intel-icon">
                    <BarChart3 size={18} color="#A78BFA" />
                  </div>
                  <div>
                    <div className="wr-intel-name">Mamaearth</div>
                    <div className="wr-intel-sub">Running <span className="wr-text-green" style={{ fontWeight: 700 }}>18 winning ads</span></div>
                  </div>
                </div>

                <div className="wr-intel-stats">
                  {[
                    { Icon: Trophy, val: '213d', label: 'Longest' },
                    { Icon: Eye, val: '4.2M', label: 'Reach' },
                    { Icon: TrendingUp, val: '+12', label: 'New' },
                    { Icon: Zap, val: '₹0.37', label: 'CPC' },
                  ].map(s => (
                    <div key={s.label} className="wr-intel-stat">
                      <s.Icon size={13} color="#A78BFA" style={{ margin: '0 auto 4px' }} />
                      <div className="wr-intel-stat-val">{s.val}</div>
                      <div className="wr-intel-stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="wr-intel-insight">
                  <div className="wr-label" style={{ fontSize: 9, marginBottom: 5 }}>LUMI&apos;S ANALYSIS</div>
                  <div className="wr-intel-insight-text">
                    Hook: <span className="wr-text-green">before/after</span> + dermatologist endorsement. CPC below category avg.
                  </div>
                </div>

                <div className="wr-intel-footer">
                  <span className="wr-intel-link">
                    View full brief <ArrowUpRight size={12} />
                  </span>
                  <span className="wr-text-muted" style={{ fontSize: 10 }}>Updated 2h ago</span>
                </div>
              </div>
            </div>
          </IntelCard>
        </ScrollReveal>
      </div>
    </section>
  );
}
