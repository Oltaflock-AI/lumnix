'use client';

import Link from 'next/link';
import { ScrollReveal } from './ScrollReveal';

export function FinalCTA() {
  return (
    <section id="cta" className="wr-section" style={{ textAlign: 'center', overflow: 'hidden', paddingTop: 80, paddingBottom: 80 }}>
      {/* Top divider for visual separation from pricing */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 1, background: 'linear-gradient(to right, transparent, rgba(255,0,102,0.4), transparent)' }} />

      {/* Glow orb */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,102,0.25) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div className="wr-container" style={{ position: 'relative', maxWidth: 800 }}>
        <ScrollReveal>
          <span className="wr-label" style={{ display: 'inline-block', marginBottom: 28, background: 'rgba(255,0,102,0.12)', border: '1px solid rgba(255,0,102,0.25)', padding: '8px 16px', borderRadius: 24 }}>STOP GUESSING. START KNOWING.</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 20 }}>
            Marketing that guesses
            <br />is <span style={{ color: '#F87171' }}>expensive.</span>
            <br />Marketing that knows
            <br />is <span className="wr-shimmer">unstoppable.</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', marginBottom: 32, lineHeight: 1.6 }}>
            Join the <strong style={{ color: 'rgba(255,255,255,0.85)' }}>early-access waitlist</strong> of D2C brands and agencies who stopped exporting CSVs and started making decisions. Setup takes 3 minutes. Your stack takes 3 hours to build every month.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.25}>
          <Link href="/auth/signup" className="wr-cta" style={{ padding: '20px 52px', fontSize: 18, minHeight: 56 }}>
            Get early access — it&apos;s free
          </Link>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 24 }}>
            No credit card · 3 minutes to set up · Cancel anytime
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
