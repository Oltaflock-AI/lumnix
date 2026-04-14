'use client';

import { BarChart3, TrendingUp, Users, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { IntelCard } from './IntelCard';
import { ScrollReveal } from './ScrollReveal';

function MiniChart({ color = '#7C3AED', data = [20,35,28,45,38,52,48,62,55,70,65,78] }: { color?: string; data?: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 200, h = 60;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} fill="none" preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`chart-fill-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#chart-fill-${color.replace('#','')})`} />
      <polyline points={points} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const kpis = [
  { label: 'Total Sessions', value: '9,511', change: '+12.4%', up: true, icon: Users, color: '#7C3AED', borderColor: '#7C3AED', logo: 'googleanalytics', logoColor: 'E37400' },
  { label: 'Organic Clicks', value: '214', change: '+8.2%', up: true, icon: Search, color: '#059669', borderColor: '#059669', logo: 'googlesearchconsole', logoColor: '34A853' },
  { label: 'Ad Spend', value: '₹8,159', change: '-3.1%', up: false, icon: TrendingUp, color: '#D97706', borderColor: '#D97706', logo: 'meta', logoColor: '1877F2' },
  { label: 'ROAS', value: '4.2x', change: '+23%', up: true, icon: BarChart3, color: '#0891B2', borderColor: '#0891B2' },
];

const keywords = [
  { keyword: 'promunch', position: 1, clicks: 89, impressions: 342, ctr: '26.0%', change: '—' },
  { keyword: 'soya chunks online', position: 3, clicks: 45, impressions: 890, ctr: '5.1%', change: '↑2' },
  { keyword: 'healthy snacks india', position: 7, clicks: 12, impressions: 1240, ctr: '1.0%', change: '↑4' },
  { keyword: 'protein snacks', position: 12, clicks: 3, impressions: 560, ctr: '0.5%', change: '↓1' },
];

export function DashboardPreview() {
  return (
    <section className="wr-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="wr-container">
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="wr-label" style={{ display: 'inline-block', marginBottom: 20 }}>THE PRODUCT</span>
            <h2 className="wr-section-headline" style={{ marginBottom: 20 }}>
              One intelligence layer.
              <br /><span className="wr-text-accent">Every signal. All connected.</span>
            </h2>
            <p className="wr-sub-headline" style={{ maxWidth: 560, margin: '0 auto' }}>
              GSC, GA4, Google Ads, Meta Ads — unified in one dashboard with AI that actually reads your data.
            </p>
          </div>
        </ScrollReveal>

        {/* Dashboard mockup */}
        <ScrollReveal delay={0.15}>
          <IntelCard maxTilt={3}>
            <div style={{
              background: 'rgba(11,15,26,0.8)',
              border: '1px solid rgba(139,92,246,0.15)',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 40px 120px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.08)',
            }}>
              {/* Mock toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid rgba(139,92,246,0.08)', background: 'rgba(20,25,36,0.8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F87171' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FBBF24' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }} />
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                  app.lumnix.io/dashboard
                </div>
                <div style={{ width: 60 }} />
              </div>

              <div style={{ padding: 24 }}>
                {/* KPI Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                  {kpis.map(kpi => (
                    <div key={kpi.label} style={{
                      background: 'rgba(20,25,36,0.6)',
                      border: '1px solid rgba(139,92,246,0.08)',
                      borderRadius: 14,
                      padding: '16px 14px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      {/* Top accent */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${kpi.borderColor}, transparent)` }} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {'logo' in kpi && kpi.logo ? (
                            <img src={`https://cdn.simpleicons.org/${kpi.logo}/${kpi.logoColor}`} width={13} height={13} alt={kpi.label} />
                          ) : (
                            <kpi.icon size={13} color={kpi.color} />
                          )}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: kpi.up ? '#34D399' : '#F87171', display: 'flex', alignItems: 'center', gap: 2 }}>
                          {kpi.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                          {kpi.change}
                        </span>
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{kpi.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#F0EDFF', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{kpi.value}</div>
                    </div>
                  ))}
                </div>

                {/* Chart + Table row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
                  {/* Chart */}
                  <div style={{
                    background: 'rgba(20,25,36,0.6)',
                    border: '1px solid rgba(139,92,246,0.08)',
                    borderRadius: 14,
                    padding: '16px 16px 0',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-display)' }}>Traffic Trend</div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 8, height: 2, borderRadius: 1, background: '#7C3AED' }} />
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Organic</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 8, height: 2, borderRadius: 1, background: '#0891B2' }} />
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Paid</span>
                        </div>
                      </div>
                    </div>
                    <MiniChart color="#7C3AED" data={[20,35,28,45,38,52,48,62,55,70,65,78]} />
                    <div style={{ marginTop: -20 }}>
                      <MiniChart color="#0891B2" data={[10,15,12,18,20,22,18,25,28,30,26,32]} />
                    </div>
                  </div>

                  {/* Keywords table */}
                  <div style={{
                    background: 'rgba(20,25,36,0.6)',
                    border: '1px solid rgba(139,92,246,0.08)',
                    borderRadius: 14,
                    padding: 16,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-display)', marginBottom: 12 }}>Top Keywords</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {/* Header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr 0.6fr 0.5fr', gap: 4, paddingBottom: 8, borderBottom: '1px solid rgba(139,92,246,0.06)' }}>
                        {['Keyword', 'Pos', 'Clicks', 'CTR'].map(h => (
                          <span key={h} style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
                        ))}
                      </div>
                      {keywords.map(kw => (
                        <div key={kw.keyword} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr 0.6fr 0.5fr', gap: 4, padding: '7px 0', borderBottom: '1px solid rgba(139,92,246,0.04)' }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kw.keyword}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: kw.position <= 3 ? '#34D399' : kw.position <= 10 ? '#A78BFA' : 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-display)' }}>
                            #{kw.position}
                          </span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>{kw.clicks}</span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>{kw.ctr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </IntelCard>
        </ScrollReveal>
      </div>
    </section>
  );
}
