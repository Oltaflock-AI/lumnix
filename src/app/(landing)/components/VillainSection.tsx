'use client';

import { ScrollReveal } from './ScrollReveal';

const tools = [
  {
    color: '#34A853', title: 'Google Search Console',
    logo: 'googlesearchconsole',
    knows: 'Your keyword "promunch" ranks #1',
    blind: 'Has no idea you\'re paying ₹4,200/mo to bid on the same keyword in Google Ads',
    cost: '₹0/mo spent here',
    rotate: '-2deg',
  },
  {
    color: '#E37400', title: 'Google Analytics 4',
    logo: 'googleanalytics',
    knows: 'Sessions dropped 25% last week',
    blind: 'Can\'t tell you it\'s because Mamaearth launched 12 new ads targeting your audience on Tuesday',
    cost: '₹0/mo but 3hrs/week exporting CSVs',
    rotate: '1deg',
  },
  {
    color: '#1877F2', title: 'Meta Ads Manager',
    logo: 'meta',
    knows: 'You spent ₹8,159 this month',
    blind: 'Doesn\'t know your competitors are spending 10x and stealing your audience with hooks you\'ve never seen',
    cost: '₹8,159/mo and climbing',
    rotate: '-1deg',
  },
];

export function VillainSection() {
  return (
    <section id="features" className="wr-section">
      <div className="wr-container">
        {/* Pain headline */}
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="wr-label" style={{ display: 'inline-block', marginBottom: 20 }}>THE PROBLEM</span>
            <h2 className="wr-section-headline" style={{ marginBottom: 24 }}>
              You&apos;re paying for{' '}
              <span style={{ color: '#F87171' }}>5 tools</span>
              <br />that can&apos;t see each other.
            </h2>
            <p className="wr-sub-headline" style={{ maxWidth: 620, margin: '0 auto' }}>
              Every tool knows <em>something</em>. None of them know <strong style={{ color: '#fff' }}>everything</strong>.
              <br />That gap is where you&apos;re losing money.
            </p>
          </div>
        </ScrollReveal>

        {/* Broken tools — bigger, bolder cards */}
        <ScrollReveal delay={0.15}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 48 }}>
            {tools.map(tool => (
              <div key={tool.title} className="wr-pain-card" style={{ transform: `rotate(${tool.rotate})` }}>
                {/* Tool header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${tool.color}20`, border: `1px solid ${tool.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={`https://cdn.simpleicons.org/${tool.logo}/${tool.color.replace('#','')}`} width={20} height={20} alt={tool.title} style={{ flexShrink: 0 }} />
                  </div>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-display)' }}>{tool.title}</span>
                  </div>
                </div>

                {/* What it knows */}
                <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(52,211,153,0.06)', borderRadius: 10, borderLeft: '3px solid rgba(52,211,153,0.4)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#34D399', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>KNOWS</div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{tool.knows}</p>
                </div>

                {/* What it's blind to */}
                <div style={{ padding: '12px 14px', background: 'rgba(248,113,113,0.06)', borderRadius: 10, borderLeft: '3px solid rgba(248,113,113,0.4)', marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#F87171', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>BLIND TO</div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{tool.blind}</p>
                </div>

                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{tool.cost}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* The gut punch — tight, no fluff */}
        <ScrollReveal delay={0.25}>
          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 16 }}>
              None of your tools know what your <span style={{ color: '#F87171' }}>competitors</span> are doing.
            </p>
            <p style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              <span className="wr-shimmer">Until now.</span>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
