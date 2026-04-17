'use client';

import Link from 'next/link';
import { Check, TrendingUp } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

const plans = [
  { name: 'Free', tagline: 'Get your bearings', price: '₹0', period: '/mo', features: ['2 integrations', '30-day data retention', '2 team members', 'Basic insights'], cta: 'Get started', primary: false },
  { name: 'Starter', tagline: 'For early-stage brands', price: '₹2,499', period: '/mo', features: ['4 integrations', '90-day retention', '5 team members', 'AI insights', 'PDF reports'], cta: 'Try Starter free', primary: false },
  { name: 'Growth', tagline: 'For scaling brands', price: '₹6,499', period: '/mo', features: ['All integrations', '1-year retention', '15 team members', 'AI chat + insights', 'White-label reports', 'Competitor tracking'], cta: 'Try Growth free →', primary: true, popular: true },
  { name: 'Agency', tagline: 'For multi-brand agencies', price: '₹16,499', period: '/mo', features: ['Unlimited everything', 'Unlimited retention', 'Unlimited team', 'Everything in Growth', 'Multi-workspace', 'Priority support', 'API access'], cta: 'Try Agency free', primary: false },
];

export function PricingSection() {
  return (
    <section id="pricing" className="wr-section wr-light-section">
      <div className="wr-container">
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
              Less than the cost of one bad ad.
            </h2>
            <p style={{ fontSize: 18, color: '#9CA3AF', maxWidth: 480, margin: '0 auto 12px' }}>
              The tools you&apos;re replacing cost ₹75,000/mo combined.
            </p>
            <p style={{ fontSize: 16, color: '#FF0066', fontWeight: 600 }}>
              Lumnix starts at ₹2,499. <span style={{ color: '#059669', fontWeight: 700 }}>Try any plan free for 7 days.</span>
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="wr-pricing-grid" style={{ marginTop: 32 }}>
            {plans.map(plan => (
              <div key={plan.name} style={{
                background: '#fff', borderRadius: 18, padding: '24px 22px', position: 'relative',
                border: plan.popular ? '2px solid #FF0066' : '1px solid #E4E5EC',
                boxShadow: plan.popular ? '0 8px 40px rgba(255,0,102,0.15)' : '0 2px 12px rgba(91,33,182,0.06)',
                transition: 'all 0.25s cubic-bezier(0.23,1,0.32,1)',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {plan.popular && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#FF0066', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>Most Popular</div>
                )}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{plan.name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10, fontWeight: 500 }}>{plan.tagline}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: '#9CA3AF' }}>{plan.period}</span>
                </div>
                {plan.name !== 'Free' && (
                  <p style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginBottom: 16 }}>
                    7 days free · no card required
                  </p>
                )}
                {plan.name === 'Free' && <div style={{ marginBottom: 16 }} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(5,150,105,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={9} color="#059669" />
                      </div>
                      <span style={{ fontSize: 13, color: '#4B5563' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/auth/signup"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '100%', padding: '13px 0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms', minHeight: 44, textDecoration: 'none',
                    background: plan.primary ? '#FF0066' : 'transparent',
                    color: plan.primary ? '#fff' : '#FF0066',
                    border: plan.primary ? 'none' : '1px solid #FF0066',
                  }}
                >{plan.cta}</Link>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div
            style={{
              position: 'relative',
              maxWidth: 720,
              margin: '56px auto 0',
              textAlign: 'center',
              padding: '44px 40px 40px',
              background: 'linear-gradient(135deg, rgba(255,0,102,0.06) 0%, rgba(123,97,255,0.04) 100%)',
              border: '1px solid rgba(255,0,102,0.12)',
              borderRadius: 24,
              boxShadow: '0 8px 40px rgba(255,0,102,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(20px, 2.5vw, 26px)',
                fontWeight: 800, color: '#1A1028',
                letterSpacing: '-0.02em', lineHeight: 1.45, marginBottom: 8,
              }}
            >
              I replaced{' '}
              <span style={{ color: '#DC2626', textDecoration: 'line-through', textDecorationColor: 'rgba(220,38,38,0.4)', fontWeight: 700 }}>
                Ahrefs (₹8,000/mo)
              </span>
              ,{' '}
              <span style={{ color: '#DC2626', textDecoration: 'line-through', textDecorationColor: 'rgba(220,38,38,0.4)', fontWeight: 700 }}>
                Atria ($129/mo)
              </span>
              , and{' '}
              <span style={{ color: '#DC2626', textDecoration: 'line-through', textDecorationColor: 'rgba(220,38,38,0.4)', fontWeight: 700 }}>
                3 hours/week
              </span>{' '}
              of manual reporting with{' '}
              <span style={{ color: '#059669', fontWeight: 800 }}>Lumnix</span>.
            </p>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                margin: '16px auto 20px', padding: '6px 16px',
                background: 'rgba(5,150,105,0.10)', border: '1px solid rgba(5,150,105,0.20)',
                borderRadius: 100, fontSize: 13, fontWeight: 700, color: '#059669',
              }}
            >
              <TrendingUp size={14} strokeWidth={2.5} />
              Saving ₹18,700/mo + 12 hrs/month
            </div>
            <p style={{ fontSize: 14, color: '#8B7AA0', fontWeight: 600 }}>
              — Early access user, <strong style={{ color: '#5B21B6', fontWeight: 700 }}>D2C snack brand</strong>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
