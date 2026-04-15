'use client';

import { Trophy, Eye, TrendingUp, ArrowUpRight, BarChart3, Zap } from 'lucide-react';
import { IntelCard } from './IntelCard';
import { ScrollReveal } from './ScrollReveal';

/* Mini sparkline SVG — pure visual, no library needed */
function Sparkline({ color = '#7C3AED', data = [3,5,4,7,6,8,7,9,8,11,10,14,12,15] }: { color?: string; data?: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 120, h = 32;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill="url(#spark-fill)" />
      <polyline points={points} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="wr-section" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', paddingTop: 96, paddingBottom: 48 }}>
      {/* Orbs */}
      <div style={{ position: 'absolute', top: '15%', left: '10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 65%)', animation: 'wr-orb 6s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(8,145,178,0.15) 0%, transparent 65%)', animation: 'wr-orb 8s ease-in-out infinite 2s', pointerEvents: 'none' }} />

      <div className="wr-container wr-grid-2" style={{ alignItems: 'center' }}>
        {/* Copy */}
        <div>
          <ScrollReveal delay={0.1}>
            <span className="wr-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', padding: '8px 16px', borderRadius: 24 }}>
              <span className="wr-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
              Now in early access
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <h1 className="wr-hero-headline" style={{ marginBottom: 28 }}>
              Your competitors
              <br />know something
              <br /><span className="wr-shimmer">you don&apos;t.</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.35}>
            <p className="wr-sub-headline" style={{ marginBottom: 20, maxWidth: 540 }}>
              While you&apos;re switching between 5 dashboards,
              they&apos;re making decisions in <strong style={{ color: '#fff' }}>one.</strong>
            </p>
            <p className="wr-body-large" style={{ marginBottom: 36, maxWidth: 480 }}>
              Your team wastes <span style={{ color: '#F87171', fontWeight: 700 }}>14 hours/week</span> stitching data across tools that don&apos;t talk to each other.
            </p>
            <p style={{ fontSize: 18, color: '#fff', fontWeight: 600, marginBottom: 36 }}>
              Lumnix ends that. Today.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.5}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
              <a href="/auth/signup" className="wr-cta" style={{ fontSize: 17, padding: '18px 36px', minHeight: 56 }}>
                Get early access — it&apos;s free <span style={{ fontSize: 20 }}>→</span>
              </a>
              <a href="#features" style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '17px 28px', fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'all 200ms', minHeight: 56, display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'transparent'; }}>
                See how it works ↓
              </a>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
              <span style={{ color: '#F87171' }}>₹75,000/mo</span> in tools → replaced by <span style={{ color: '#34D399' }}>₹2,499/mo</span>
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.65}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 36, padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex' }}>
                {['KH', 'AM', 'VS', 'PR', 'RK'].map((init, i) => (
                  <div key={init} style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${260 + i * 15}, 70%, ${40 + i * 5}%)`, border: '2.5px solid #07051A', marginLeft: i > 0 ? -10 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{init}</div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 600, lineHeight: 1.3 }}>200+ brands</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>already in early access</p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* 3D Intel Card — richified with sparklines and KPI row */}
        <ScrollReveal delay={0.3} className="flex justify-center">
          <IntelCard className="wr-float">
            <div className="wr-glass" style={{ width: '100%', maxWidth: 420, padding: 0, boxShadow: '0 32px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.1)', borderColor: 'rgba(124,58,237,0.4)', borderRadius: 24, overflow: 'hidden' }}>

              {/* Top KPI strip */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { label: 'Sessions', value: '9,511', change: '+12%', color: '#34D399', data: [4,5,4,6,5,7,6,8,7,9,8,10,9,11] },
                  { label: 'Clicks', value: '214', change: '+8%', color: '#7C3AED', data: [2,3,2,4,3,5,4,5,4,6,5,6,5,7] },
                  { label: 'ROAS', value: '4.2x', change: '+23%', color: '#0891B2', data: [2,2,3,3,3,4,3,4,4,4,5,4,5,5] },
                ].map((kpi, i) => (
                  <div key={kpi.label} style={{ flex: 1, padding: '12px 10px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>{kpi.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{kpi.value}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: kpi.color }}>{kpi.change}</span>
                    </div>
                    <Sparkline color={kpi.color} data={kpi.data} />
                  </div>
                ))}
              </div>

              {/* Main card body */}
              <div style={{ padding: '24px 28px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span className="wr-label" style={{ fontSize: 10 }}>COMPETITOR INTEL</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#34D399', fontWeight: 700 }}>
                    <span className="wr-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
                    LIVE
                  </div>
                </div>

                {/* Competitor */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(8,145,178,0.15))', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BarChart3 size={18} color="#A78BFA" />
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Mamaearth</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Running <span style={{ color: '#34D399', fontWeight: 700 }}>18 winning ads</span></div>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {[
                    { Icon: Trophy, val: '213d', label: 'Longest' },
                    { Icon: Eye, val: '4.2M', label: 'Reach' },
                    { Icon: TrendingUp, val: '+12', label: 'New' },
                    { Icon: Zap, val: '₹0.37', label: 'CPC' },
                  ].map(s => (
                    <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 6px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <s.Icon size={13} color="#A78BFA" style={{ margin: '0 auto 4px' }} />
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* AI insight */}
                <div style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderLeft: '4px solid #7C3AED', borderRadius: '0 12px 12px 0', padding: '12px 14px', marginBottom: 16 }}>
                  <div className="wr-label" style={{ fontSize: 9, marginBottom: 5 }}>LUMI&apos;S ANALYSIS</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, fontWeight: 500 }}>
                    Hook: <span style={{ color: '#34D399' }}>before/after</span> + dermatologist endorsement. CPC below category avg.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#A78BFA', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    View full brief <ArrowUpRight size={12} />
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Updated 2h ago</span>
                </div>
              </div>
            </div>
          </IntelCard>
        </ScrollReveal>
      </div>
    </section>
  );
}
