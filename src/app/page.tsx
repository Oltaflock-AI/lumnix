'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, Check, Zap, Brain, Target, FileText, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const FEATURES = [
  {
    icon: Zap,
    title: 'AI Anomaly Detection',
    desc: 'Know before your client does. Daily scans surface traffic drops, ranking changes, and CTR anomalies automatically.',
  },
  {
    icon: Target,
    title: 'Competitor Intelligence',
    desc: "See exactly which keywords your competitors rank for that you don't. Close the gap.",
  },
  {
    icon: FileText,
    title: 'Unified Reporting',
    desc: 'One PDF. All your data. Branded and sent automatically. No more Monday morning spreadsheets.',
  },
];

const PRICING = [
  {
    name: 'Starter',
    price: '$29',
    period: '/mo',
    desc: 'For solo marketers and small teams',
    features: ['GSC + GA4 integration', '3 competitor tracking', 'Email alerts', 'PDF reports', '30-day data history'],
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$79',
    period: '/mo',
    desc: 'For growing teams that run on data',
    badge: 'Most Popular',
    features: ['Everything in Starter', 'Google Ads + Meta Ads', 'Slack alerts', 'AI anomaly detection', '10 competitor tracking', '12-month data history', 'Priority support'],
    highlight: true,
  },
  {
    name: 'Agency',
    price: '$199',
    period: '/mo',
    desc: 'For agencies managing multiple clients',
    features: ['Everything in Growth', 'White-label reports', 'Team invites & roles', 'Unlimited competitors', 'Custom branding', 'API access', 'Dedicated support'],
    highlight: false,
  },
];

const METRICS = [
  { value: '10,000+', label: 'keywords tracked' },
  { value: '500+', label: 'reports generated' },
  { value: 'Trusted by', label: 'marketing teams' },
];

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard');
    });
  }, [router]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FAFAFA', fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>

      {/* ──── Navbar ──── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 40px', height: 64,
        backgroundColor: scrolled ? 'rgba(10,10,10,0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid #222222' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: '#FAFAFA' }}>
          <span style={{ color: '#6366F1' }}>L</span>umnix
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="#features" style={{ padding: '8px 16px', color: '#888888', fontSize: 14, textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}>Features</a>
          <a href="#pricing" style={{ padding: '8px 16px', color: '#888888', fontSize: 14, textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}>Pricing</a>
          <button
            onClick={() => router.push('/auth/signin')}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: '#FAFAFA', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            Sign in
          </button>
          <button
            onClick={() => router.push('/auth/signup')}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', backgroundColor: '#6366F1', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4F46E5')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#6366F1')}
          >
            Start free trial
          </button>
        </div>
      </nav>

      {/* ──── Hero ──── */}
      <section style={{ textAlign: 'center', padding: '100px 40px 80px', maxWidth: 800, margin: '0 auto', position: 'relative' }}>
        {/* Pill badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 100,
          border: '1px solid rgba(99,102,241,0.3)',
          backgroundColor: 'rgba(99,102,241,0.08)',
          marginBottom: 32,
        }}>
          <Zap size={12} color="#6366F1" />
          <span style={{ fontSize: 13, color: '#6366F1', fontWeight: 600 }}>Marketing Intelligence Platform</span>
        </div>

        <h1 style={{
          fontSize: 64, fontWeight: 700, lineHeight: 1.05,
          letterSpacing: '-2.5px', marginBottom: 24,
          fontFamily: 'var(--font-display)',
          background: 'linear-gradient(180deg, #FAFAFA 0%, #888888 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Stop switching tabs.<br />Start making decisions.
        </h1>

        <p style={{ fontSize: 18, color: '#888888', lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
          Lumnix unifies GA4, GSC, Google Ads and Meta Ads into one AI-powered dashboard. Anomaly detection, competitor intelligence, automated reports.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/auth/signup')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 10, border: 'none',
              backgroundColor: '#6366F1', color: 'white',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4F46E5')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#6366F1')}
          >
            Start free trial <ArrowRight size={16} />
          </button>
          <button
            onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 10,
              border: '1px solid #333333', backgroundColor: 'transparent',
              color: '#FAFAFA', fontSize: 15, fontWeight: 500, cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1A1A1A')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            See how it works
          </button>
        </div>

        {/* Hero visual — fake dashboard mockup */}
        <div style={{
          marginTop: 72, position: 'relative',
          borderRadius: 16, border: '1px solid #222222',
          backgroundColor: '#111111', padding: 24,
          overflow: 'hidden',
        }}>
          {/* Glow effect */}
          <div style={{
            position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
            width: 600, height: 200,
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Fake top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#333333' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#333333' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#333333' }} />
            <div style={{ flex: 1 }} />
            <div style={{ width: 60, height: 6, borderRadius: 3, backgroundColor: '#1A1A1A' }} />
          </div>

          {/* Fake stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {['12.4K', '8.2K', '#4.2', '89%'].map((val, i) => (
              <div key={i} style={{ backgroundColor: '#1A1A1A', borderRadius: 10, padding: '16px 14px', border: '1px solid #222222' }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#333333', marginBottom: 12 }} />
                <div style={{ fontSize: 22, fontWeight: 500, fontFamily: 'var(--font-mono)', color: '#FAFAFA', letterSpacing: '-0.5px' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Fake chart area */}
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: 10, padding: 20, border: '1px solid #222222', height: 160, position: 'relative', overflow: 'hidden' }}>
            <svg width="100%" height="100%" viewBox="0 0 600 120" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,80 C50,70 100,40 150,55 C200,70 250,20 300,35 C350,50 400,15 450,25 C500,35 550,10 600,20 L600,120 L0,120 Z" fill="url(#chartGrad)" />
              <path d="M0,80 C50,70 100,40 150,55 C200,70 250,20 300,35 C350,50 400,15 450,25 C500,35 550,10 600,20" fill="none" stroke="#6366F1" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </section>

      {/* ──── Metrics bar ──── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 48, padding: '32px 40px',
        borderTop: '1px solid #222222', borderBottom: '1px solid #222222',
        flexWrap: 'wrap',
      }}>
        {METRICS.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#FAFAFA', fontFamily: 'var(--font-mono)' }}>{m.value}</span>
            <span style={{ fontSize: 14, color: '#555555' }}>{m.label}</span>
            {i < METRICS.length - 1 && (
              <div style={{ width: 1, height: 24, backgroundColor: '#222222', marginLeft: 36 }} />
            )}
          </div>
        ))}
      </div>

      {/* ──── Features ──── */}
      <section id="features" style={{ padding: '100px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-1.5px', marginBottom: 16, color: '#FAFAFA' }}>
            Intelligence, not just data
          </h2>
          <p style={{ fontSize: 16, color: '#555555', maxWidth: 480, margin: '0 auto' }}>
            Built for marketing teams who need answers, not dashboards full of numbers.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {FEATURES.map(f => (
            <div
              key={f.title}
              style={{
                backgroundColor: '#111111', border: '1px solid #222222',
                borderRadius: 12, padding: 28,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#333333')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#222222')}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                backgroundColor: 'rgba(99,102,241,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <f.icon size={20} color="#6366F1" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#FAFAFA', marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#888888', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ──── Pricing ──── */}
      <section id="pricing" style={{ padding: '100px 40px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-1.5px', marginBottom: 16, color: '#FAFAFA' }}>
            Simple, transparent pricing
          </h2>
          <p style={{ fontSize: 16, color: '#555555' }}>Start free. Upgrade when you're ready.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>
          {PRICING.map(p => (
            <div
              key={p.name}
              style={{
                backgroundColor: '#111111',
                border: `1px solid ${p.highlight ? '#6366F1' : '#222222'}`,
                borderRadius: 12, padding: 32, position: 'relative',
                ...(p.highlight ? { boxShadow: '0 0 60px rgba(99,102,241,0.1)' } : {}),
              }}
            >
              {p.badge && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  backgroundColor: '#6366F1', color: 'white',
                  fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 100,
                  letterSpacing: '0.02em',
                }}>
                  {p.badge}
                </div>
              )}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#888888', marginBottom: 8 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 42, fontWeight: 700, color: '#FAFAFA', letterSpacing: '-1px', fontFamily: 'var(--font-mono)' }}>{p.price}</span>
                  <span style={{ fontSize: 14, color: '#555555' }}>{p.period}</span>
                </div>
                <p style={{ fontSize: 13, color: '#555555', marginTop: 8 }}>{p.desc}</p>
              </div>
              <div style={{ marginBottom: 28 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Check size={14} color={p.highlight ? '#6366F1' : '#555555'} strokeWidth={2.5} />
                    <span style={{ fontSize: 13, color: '#888888' }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push('/auth/signup')}
                style={{
                  width: '100%', padding: 12, borderRadius: 8, cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                  border: p.highlight ? 'none' : '1px solid #333333',
                  backgroundColor: p.highlight ? '#6366F1' : 'transparent',
                  color: p.highlight ? 'white' : '#FAFAFA',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = p.highlight ? '#4F46E5' : '#1A1A1A';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = p.highlight ? '#6366F1' : 'transparent';
                }}
              >
                {p.highlight ? 'Start free trial' : p.name === 'Agency' ? 'Contact sales' : 'Get started'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section style={{ padding: '100px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-1.5px', marginBottom: 16, color: '#FAFAFA' }}>
          Ready to stop guessing?
        </h2>
        <p style={{ fontSize: 16, color: '#555555', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
          Join marketing teams who replaced 6 tools with one intelligent dashboard.
        </p>
        <button
          onClick={() => router.push('/auth/signup')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '16px 36px', borderRadius: 10, border: 'none',
            backgroundColor: '#6366F1', color: 'white',
            fontSize: 16, fontWeight: 600, cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4F46E5')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#6366F1')}
        >
          Start free trial <ArrowRight size={18} />
        </button>
      </section>

      {/* ──── Footer ──── */}
      <footer style={{
        padding: '32px 40px', borderTop: '1px solid #222222',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.5px', color: '#FAFAFA' }}>
            <span style={{ color: '#6366F1' }}>L</span>umnix
          </span>
          <span style={{ fontSize: 13, color: '#555555', marginLeft: 12 }}>AI-powered marketing intelligence</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Support', 'Status'].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: '#555555', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#888888')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555555')}
            >{l}</a>
          ))}
        </div>
        <span style={{ fontSize: 12, color: '#333333' }}>&copy; 2026 Oltaflock AI. All rights reserved.</span>
      </footer>
    </div>
  );
}
