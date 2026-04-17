'use client';

import { Check, Clock, Eye, TrendingUp, Heart, MessageCircle, Share2 } from 'lucide-react';
import { IntelCard } from './IntelCard';
import { ScrollReveal } from './ScrollReveal';

const points = [
  'Add competitor by name, website, or Facebook URL',
  '90-day longevity = proven winner signal',
  'AI brief: exactly what hooks, pain points, and offers they use',
];

export function AdSpySection() {
  return (
    <section id="adspy" className="wr-section">
      <div className="wr-container wr-grid-2" style={{ alignItems: 'center' }}>
        <div>
          <ScrollReveal>
            <span className="wr-label" style={{ display: 'inline-block', marginBottom: 20 }}>COMPETITOR AD SPY</span>
            <h2 className="wr-section-headline" style={{ marginBottom: 28 }}>
              They&apos;ve been testing ads
              <br />for <span style={{ color: '#F87171' }}>6 months.</span>
              <br /><span className="wr-text-accent">You&apos;re about to see every single one.</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <p className="wr-body-large" style={{ marginBottom: 20 }}>
              Who has time to check <span style={{ color: '#fff', fontWeight: 600 }}>500 ads per competitor</span>? Nobody.
            </p>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', marginBottom: 28, lineHeight: 1.6 }}>
              Ad running <span style={{ color: '#34D399', fontWeight: 700 }}>90+ days</span> = Meta kept serving it = <strong style={{ color: '#fff' }}>it works.</strong> Our AI tells you exactly why.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.25}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {points.map(point => (
                <div key={point} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Check size={11} color="#34D399" />
                  </div>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{point}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>

        {/* Rich ad card stack */}
        <ScrollReveal delay={0.2}>
          <div style={{ position: 'relative' }}>
            {/* Background stacked cards — hidden on mobile */}
            <div className="wr-hide-mobile" style={{ position: 'absolute', top: 30, left: -10, width: '100%', maxWidth: 380, height: 300, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 18, transform: 'rotate(-4deg)', zIndex: 0 }} />
            <div className="wr-hide-mobile" style={{ position: 'absolute', top: 15, left: -5, width: '100%', maxWidth: 380, height: 300, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18, transform: 'rotate(-2deg)', zIndex: 0 }} />

            <IntelCard maxTilt={12} style={{ position: 'relative', zIndex: 1, width: '100%' }}>
              <div className="lx-pop-card" style={{ width: '100%', maxWidth: 400, background: 'rgba(19,19,26,0.92)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,0,102,0.4)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 50px rgba(255,0,102,0.08)', transformStyle: 'preserve-3d', transition: 'box-shadow 0.4s cubic-bezier(0.23,1,0.32,1), border-color 0.4s' }}>
                {/* Ad creative area */}
                <div style={{ height: 180, background: 'linear-gradient(135deg, rgba(255,0,102,0.15) 0%, rgba(0,212,170,0.1) 50%, rgba(52,211,153,0.05) 100%)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Badges */}
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                    <span className="lx-shimmer-badge" style={{ position: 'relative', overflow: 'hidden', background: '#FF0066', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 11px', borderRadius: 20, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 4px 14px rgba(255,0,102,0.5)', transform: 'translateZ(40px)' }}>
                      <TrendingUp size={11} strokeWidth={2.5} /> TOP PERFORMER
                    </span>
                  </div>
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#34D399', fontSize: 12, fontWeight: 800, padding: '5px 11px', borderRadius: 10, border: '1px solid rgba(52,211,153,0.25)', transform: 'translateZ(40px)' }}>
                    <Clock size={11} strokeWidth={2.5} /> 213 days
                  </div>
                  {/* Ad visual — product showcase layout */}
                  <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
                    {/* Product bottles illustration */}
                    <div className="lx-bottles" style={{ display: 'flex', gap: 8, alignItems: 'flex-end', transform: 'translateZ(30px)' }}>
                      {[44, 56, 44].map((h, i) => (
                        <div key={i} style={{
                          width: 28, height: h, borderRadius: '6px 6px 4px 4px',
                          background: `linear-gradient(180deg, ${['rgba(52,211,153,0.65)', 'rgba(255,0,102,0.7)', 'rgba(0,212,170,0.65)'][i]} 0%, ${['rgba(52,211,153,0.2)', 'rgba(255,0,102,0.2)', 'rgba(0,212,170,0.2)'][i]} 100%)`,
                          border: `1px solid ${['rgba(52,211,153,0.45)', 'rgba(255,0,102,0.5)', 'rgba(0,212,170,0.45)'][i]}`,
                          boxShadow: `0 8px 18px ${['rgba(52,211,153,0.18)', 'rgba(255,0,102,0.25)', 'rgba(0,212,170,0.18)'][i]}`,
                        }} />
                      ))}
                    </div>
                    {/* Ad headline */}
                    <div style={{ textAlign: 'center', transform: 'translateZ(50px)' }}>
                      <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-display)', lineHeight: 1.2, letterSpacing: '-0.02em', textShadow: '0 2px 18px rgba(0,0,0,0.5)' }}>
                        &ldquo;My hair fall stopped<br />in 3 weeks&rdquo;
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 8, fontWeight: 600, letterSpacing: '0.02em' }}>
                        ★★★★★ <span style={{ color: '#fff', fontWeight: 800 }}>4.6</span> · 12,847 reviews
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ad content */}
                <div style={{ padding: '18px 20px', transform: 'translateZ(20px)' }}>
                  {/* Brand row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #34A853, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', boxShadow: '0 4px 12px rgba(52,168,83,0.4)' }}>M</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>Mamaearth</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Sponsored</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.45, marginBottom: 14, letterSpacing: '-0.01em' }}>
                    Onion Hair Oil That Actually Works — <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Dermatologically tested. Over 1 million bottles sold.</span>
                  </div>

                  {/* Engagement metrics */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {[
                      { Icon: Heart, val: '12.4K' },
                      { Icon: MessageCircle, val: '892' },
                      { Icon: Share2, val: '2.1K' },
                      { Icon: Eye, val: '4.2M' },
                    ].map(m => (
                      <div key={m.val} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <m.Icon size={13} color="rgba(255,255,255,0.55)" strokeWidth={2.2} />
                        <span style={{ fontSize: 12, color: '#fff', fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{m.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI analysis bar */}
                <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg, rgba(255,0,102,0.18) 0%, rgba(255,0,102,0.08) 100%)', borderTop: '1px solid rgba(255,0,102,0.25)', transform: 'translateZ(15px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span className="wr-label" style={{ fontSize: 10, fontWeight: 800, color: '#FF0066', letterSpacing: '0.08em' }}>LUMI&apos;S TAKE</span>
                      <p style={{ fontSize: 13, color: '#fff', marginTop: 4, lineHeight: 1.45, fontWeight: 600 }}>
                        Before/after hook + authority (dermatologist). Runs because <span style={{ color: '#34D399', fontWeight: 800 }}>CPC stays below ₹0.37</span>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </IntelCard>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
