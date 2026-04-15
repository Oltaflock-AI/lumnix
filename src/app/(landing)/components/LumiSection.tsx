'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from './ScrollReveal';

const convos = [
  { q: 'Why did my traffic drop last week?', a: "Your top GSC keyword 'promunch' dropped from position 1.2 to position 3.8 between Apr 8–10. This coincides with a new Mamaearth campaign targeting the same search intent. Recommend: strengthen the page's internal linking and update the meta title." },
  { q: 'What should I focus on this week?', a: "3 quick wins on page 1: 'soya mini chunks' (190 impressions, 0% CTR), 'soya munch' (8 impressions, 0% CTR), 'peri peri soya' (1 impression, 1 click). Fixing meta titles on these 3 pages could add ~20 organic clicks/week at zero cost." },
  { q: 'Compare my organic vs paid this month', a: 'Organic: 214 clicks, ₹0 spend, estimated ₹6,200 value at avg CPC. Paid: 18,038 clicks, ₹8,159 spend, ₹0.45 CPC. Organic CTR 26% vs paid CTR 3.87%. Your organic is significantly more efficient — consider doubling down on content.' },
];

export function LumiSection() {
  const [activeQ, setActiveQ] = useState(0);

  return (
    <section id="lumi" className="wr-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="wr-container wr-grid-2-equal" style={{ alignItems: 'center' }}>
        <div>
          <ScrollReveal>
            <span className="wr-label" style={{ display: 'inline-block', marginBottom: 20 }}>AI ASSISTANT — LUMI</span>
            <h2 className="wr-section-headline" style={{ marginBottom: 24 }}>
              Stop pulling reports.
              <br /><span className="wr-text-accent">Start asking questions.</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <p className="wr-body-large" style={{ marginBottom: 28 }}>
              Not a chatbot. Lumi reads <strong style={{ color: '#fff' }}>your actual data</strong> — keywords, campaigns, competitors — and tells you what to do next.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.25}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {convos.map((c, i) => (
                <button key={i} onClick={() => setActiveQ(i)} aria-label={`Show answer to: ${c.q}`} aria-pressed={activeQ === i} style={{
                  textAlign: 'left', padding: '14px 16px', borderRadius: 10, fontSize: 14, cursor: 'pointer', transition: 'all 150ms', minHeight: 48,
                  border: activeQ === i ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  background: activeQ === i ? 'rgba(124,58,237,0.12)' : 'transparent',
                  color: activeQ === i ? '#fff' : 'rgba(255,255,255,0.65)',
                }}>
                  &ldquo;{c.q}&rdquo;
                </button>
              ))}
            </div>
          </ScrollReveal>
        </div>

        {/* Chat window */}
        <ScrollReveal delay={0.2}>
          <div className="wr-glass" style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Image src="/favicon.png" alt="Lumi" width={30} height={30} style={{ borderRadius: 8 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-display)' }}>Lumi</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>AI Marketing Assistant</div>
              </div>
              <span className="wr-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', marginLeft: 'auto' }} />
            </div>

            <div style={{ padding: 20, minHeight: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ background: '#7C3AED', color: '#fff', padding: '10px 14px', borderRadius: '18px 18px 4px 18px', fontSize: 13, maxWidth: '80%', lineHeight: 1.5, boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                  &ldquo;{convos[activeQ].q}&rdquo;
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Image src="/favicon.png" alt="Lumi" width={28} height={28} style={{ borderRadius: 7, flexShrink: 0, marginTop: 2 }} />
                <div style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)', padding: '12px 14px', borderRadius: '18px 18px 18px 4px', fontSize: 13, lineHeight: 1.65, maxWidth: '85%' }}>
                  {convos[activeQ].a}
                </div>
              </div>
            </div>

            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Ask Lumi anything...</div>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <Send size={14} color="#fff" />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
