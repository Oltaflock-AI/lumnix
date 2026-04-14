'use client';

import { ScrollReveal } from './ScrollReveal';
import { CountUp } from './CountUp';

const stats = [
  { target: 2.4, prefix: '₹', suffix: ' Cr', label: 'AD SPEND ANALYSED', note: 'Synced and analyzed in first 30 days of beta', format: (n: number) => n.toFixed(1) },
  { target: 14, suffix: ' hrs', label: 'SAVED WEEKLY', note: 'Time reclaimed from manual data stitching per team', },
  { target: 165, suffix: 'x', label: 'PEAK ROAS TRACKED', note: 'Real Google Ads campaign performance recorded' },
  { target: 47, label: 'COMPETITOR ADS FOUND', note: 'Meta winning ads uncovered for one brand in week one' },
];

export function ProofSection() {
  return (
    <section className="wr-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(124,58,237,0.06), transparent)', pointerEvents: 'none' }} />

      <div className="wr-container">
        <ScrollReveal>
          <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 48 }}>
            The numbers don&apos;t lie
          </p>
        </ScrollReveal>

        <div className="wr-grid-4" style={{ gap: 32 }}>
          {stats.map((s, i) => (
            <ScrollReveal key={s.label} delay={0.1 * i}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="wr-stat-number wr-text-green" style={{ marginBottom: 12 }}>
                  <CountUp target={s.target} prefix={s.prefix || ''} suffix={s.suffix || ''} format={s.format} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 8, letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, maxWidth: 200, margin: '0 auto' }}>
                  {s.note}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
