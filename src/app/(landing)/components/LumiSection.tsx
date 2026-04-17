'use client';

import { useState } from 'react';
import { Activity, BarChart3, Clock, Send } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

/* Lumi avatar — friendly glowing orb (mono 2.0 style) */
function LumiAvatar({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="lumi-grad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFF" stopOpacity="1" />
          <stop offset="60%" stopColor="#FFB3D9" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FF0066" stopOpacity="0.6" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" stroke="#FF0066" strokeWidth="2" opacity="0.3" />
      <circle cx="60" cy="60" r="35" fill="url(#lumi-grad)" />
      <circle cx="48" cy="48" r="10" fill="white" opacity="0.4" />
      <circle cx="50" cy="55" r="3" fill="white" />
      <circle cx="49.5" cy="54" r="1.5" fill="#FF0066" opacity="0.7" />
      <circle cx="70" cy="55" r="3" fill="white" />
      <circle cx="70.5" cy="54" r="1.5" fill="#FF0066" opacity="0.7" />
      <path d="M50 65Q60 71 70 65" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

const convos = [
  { q: 'Why did my traffic drop last week?', a: "Your top GSC keyword 'promunch' dropped from position 1.2 to position 3.8 between Apr 8–10. This coincides with a new Mamaearth campaign targeting the same search intent. Recommend: strengthen the page's internal linking and update the meta title.", Icon: Activity },
  { q: 'What should I focus on this week?', a: "3 quick wins on page 1: 'soya mini chunks' (190 impressions, 0% CTR), 'soya munch' (8 impressions, 0% CTR), 'peri peri soya' (1 impression, 1 click). Fixing meta titles on these 3 pages could add ~20 organic clicks/week at zero cost.", Icon: Clock },
  { q: 'Compare my organic vs paid this month', a: 'Organic: 214 clicks, ₹0 spend, estimated ₹6,200 value at avg CPC. Paid: 18,038 clicks, ₹8,159 spend, ₹0.45 CPC. Organic CTR 26% vs paid CTR 3.87%. Your organic is significantly more efficient — consider doubling down on content.', Icon: BarChart3 },
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {convos.map((c, i) => {
                const active = activeQ === i;
                const Icon = c.Icon;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveQ(i)}
                    aria-label={`Show answer to: ${c.q}`}
                    aria-pressed={active}
                    style={{
                      position: 'relative',
                      textAlign: 'left',
                      padding: '18px 44px 18px 58px',
                      borderRadius: 16,
                      fontFamily: 'var(--font-display)',
                      fontSize: 15,
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.4,
                      cursor: 'pointer',
                      minHeight: 60,
                      transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)',
                      border: active ? '1px solid rgba(255,0,102,0.45)' : '1px solid rgba(255,255,255,0.07)',
                      background: active
                        ? 'linear-gradient(135deg, rgba(255,0,102,0.10) 0%, rgba(123,97,255,0.05) 100%)'
                        : 'rgba(255,255,255,0.02)',
                      color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                      boxShadow: active
                        ? '0 4px 24px rgba(255,0,102,0.10), inset 0 1px 0 rgba(255,255,255,0.04)'
                        : 'none',
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute', top: 0, left: 0, bottom: 0,
                        width: active ? 4 : 3,
                        background: '#FF0066',
                        opacity: active ? 1 : 0,
                        borderRadius: '0 4px 4px 0',
                        transition: 'opacity 0.25s, width 0.25s cubic-bezier(0.23,1,0.32,1)',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                        width: 28, height: 28, borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: active ? '#FF0066' : 'rgba(255,0,102,0.08)',
                        border: active ? '1px solid #FF0066' : '1px solid rgba(255,0,102,0.12)',
                        transition: 'all 0.25s cubic-bezier(0.23,1,0.32,1)',
                      }}
                    >
                      <Icon size={14} strokeWidth={2} color={active ? '#fff' : '#FF0066'} />
                    </span>
                    {c.q}
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute', right: 18, top: '50%',
                        transform: `translateY(-50%) translateX(${active ? 0 : -6}px)`,
                        fontSize: 16, fontWeight: 800, color: '#FF0066',
                        opacity: active ? 1 : 0,
                        transition: 'all 0.25s cubic-bezier(0.23,1,0.32,1)',
                      }}
                    >
                      →
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollReveal>
        </div>

        {/* Chat window */}
        <ScrollReveal delay={0.2}>
          <div className="wr-glass" style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <LumiAvatar size={32} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-display)' }}>Lumi</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>AI Marketing Assistant</div>
              </div>
              <span className="wr-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', marginLeft: 'auto' }} />
            </div>

            <div style={{ padding: 20, minHeight: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ background: '#FF0066', color: '#fff', padding: '10px 14px', borderRadius: '18px 18px 4px 18px', fontSize: 13, maxWidth: '80%', lineHeight: 1.5, boxShadow: '0 4px 12px rgba(255,0,102,0.3)' }}>
                  &ldquo;{convos[activeQ].q}&rdquo;
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}><LumiAvatar size={28} /></div>
                <div style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)', padding: '12px 14px', borderRadius: '18px 18px 18px 4px', fontSize: 13, lineHeight: 1.65, maxWidth: '85%' }}>
                  {convos[activeQ].a}
                </div>
              </div>
            </div>

            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Ask Lumi anything...</div>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#FF0066', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <Send size={14} color="#fff" />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
