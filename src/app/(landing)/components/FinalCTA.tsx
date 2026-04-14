'use client';

import { ScrollReveal } from './ScrollReveal';

export function FinalCTA() {
  return (
    <section className="wr-section" style={{ textAlign: 'center', overflow: 'hidden', paddingTop: 140, paddingBottom: 120 }}>
      {/* Top divider for visual separation from pricing */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 1, background: 'linear-gradient(to right, transparent, rgba(124,58,237,0.4), transparent)' }} />

      {/* Glow orb */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div className="wr-container" style={{ position: 'relative', maxWidth: 800 }}>
        <ScrollReveal>
          <span className="wr-label" style={{ display: 'inline-block', marginBottom: 28, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', padding: '8px 16px', borderRadius: 24 }}>STOP GUESSING</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(44px, 6vw, 80px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 28 }}>
            Marketing that guesses
            <br />is <span style={{ color: '#F87171' }}>expensive.</span>
            <br />Marketing that knows
            <br />is <span className="wr-shimmer">unstoppable.</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.55)', marginBottom: 48, lineHeight: 1.65 }}>
            Join <strong style={{ color: 'rgba(255,255,255,0.85)' }}>200+ brands and agencies</strong> who stopped
            exporting CSVs and started making decisions.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.25}>
          <a href="/auth/signup" className="wr-cta" style={{ padding: '20px 52px', fontSize: 18, minHeight: 56 }}>
            Get early access — it&apos;s free
          </a>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 24 }}>
            No credit card · 3 minutes to set up · Cancel anytime
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
