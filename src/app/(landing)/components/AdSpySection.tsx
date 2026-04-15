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
    <section className="wr-section">
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

            <IntelCard maxTilt={5} style={{ position: 'relative', zIndex: 1, width: '100%' }}>
              <div style={{ width: '100%', maxWidth: 400, background: 'rgba(20,25,36,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
                {/* Ad creative area */}
                <div style={{ height: 180, background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(8,145,178,0.1) 50%, rgba(52,211,153,0.05) 100%)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Badges */}
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                    <span style={{ background: '#7C3AED', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <TrendingUp size={10} /> TOP PERFORMER
                    </span>
                  </div>
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#34D399', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 10 }}>
                    <Clock size={10} /> 213 days
                  </div>
                  {/* Ad visual — product showcase layout */}
                  <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
                    {/* Product bottles illustration */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      {[44, 56, 44].map((h, i) => (
                        <div key={i} style={{
                          width: 28, height: h, borderRadius: '6px 6px 4px 4px',
                          background: `linear-gradient(180deg, ${['rgba(52,211,153,0.5)', 'rgba(124,58,237,0.5)', 'rgba(8,145,178,0.5)'][i]} 0%, ${['rgba(52,211,153,0.15)', 'rgba(124,58,237,0.15)', 'rgba(8,145,178,0.15)'][i]} 100%)`,
                          border: `1px solid ${['rgba(52,211,153,0.3)', 'rgba(124,58,237,0.3)', 'rgba(8,145,178,0.3)'][i]}`,
                        }} />
                      ))}
                    </div>
                    {/* Ad headline */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
                        &ldquo;My hair fall stopped<br />in 3 weeks&rdquo;
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6, fontStyle: 'italic' }}>
                        ★★★★★ 4.6 · 12,847 reviews
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ad content */}
                <div style={{ padding: '16px 18px' }}>
                  {/* Brand row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #34A853, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>M</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>Mamaearth</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Sponsored</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45, marginBottom: 12 }}>
                    Onion Hair Oil That Actually Works — Dermatologically tested. Over 1 million bottles sold.
                  </div>

                  {/* Engagement metrics */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {[
                      { Icon: Heart, val: '12.4K' },
                      { Icon: MessageCircle, val: '892' },
                      { Icon: Share2, val: '2.1K' },
                      { Icon: Eye, val: '4.2M' },
                    ].map(m => (
                      <div key={m.val} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <m.Icon size={12} color="rgba(255,255,255,0.35)" />
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{m.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI analysis bar */}
                <div style={{ padding: '12px 18px', background: 'rgba(124,58,237,0.1)', borderTop: '1px solid rgba(124,58,237,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span className="wr-label" style={{ fontSize: 9 }}>LUMI&apos;S TAKE</span>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3, lineHeight: 1.4 }}>
                        Before/after hook + authority (dermatologist). Runs because CPC stays below ₹0.37.
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
