'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BarChart3, Target, Brain, Zap, ArrowRight, Search, FileText, Bell, Shield, TrendingUp, Eye, Check, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const FEATURES = [
  { icon: Search, color: '#7c3aed', title: 'SEO Intelligence', desc: 'Track keyword rankings, CTR, impressions, and find quick wins. Powered by Google Search Console.' },
  { icon: BarChart3, color: '#3b82f6', title: 'Web Analytics', desc: 'Sessions, users, traffic sources, and top pages — all in one clean dashboard. GA4 connected.' },
  { icon: Brain, color: '#22c55e', title: 'AI Assistant', desc: 'Ask anything about your data. "What are my top keywords?" Get instant answers, not raw numbers.' },
  { icon: Eye, color: '#ec4899', title: 'Competitor Spy', desc: 'See exactly what ads your competitors are running on Facebook and Instagram. Updated daily.' },
  { icon: FileText, color: '#f59e0b', title: 'Client Reports', desc: 'Generate branded PDF reports in one click. SEO, traffic, and full marketing reports — client-ready.' },
  { icon: Bell, color: '#06b6d4', title: 'Smart Alerts', desc: 'Get notified when rankings drop, traffic spikes, or opportunities emerge. Never miss a signal.' },
];

const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Head of Growth, Finova', avatar: 'SC', text: "We used to spend 3 hours every Monday pulling reports from 6 different tools. Lumnix cut that to 5 minutes. The AI insights are genuinely useful — not just data dumps.", rating: 5 },
  { name: 'Marcus Webb', role: 'Founder, TalentStack', avatar: 'MW', text: "The competitor spy feature alone is worth it. I can see exactly what ads are working for my competitors and iterate faster. Game changer for paid campaigns.", rating: 5 },
  { name: 'Priya Sharma', role: 'Marketing Director, Crewflow', avatar: 'PS', text: "Finally a tool that connects SEO and paid in one place. The reports are so clean I send them directly to clients without touching them. Saves me hours every week.", rating: 5 },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'For solo founders getting started',
    color: '#52525b',
    features: ['1 integration', '30-day data history', 'SEO & Analytics dashboard', 'Basic reports (watermarked)', '5 AI queries/month'],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: 'per month',
    desc: 'For growing teams that run on data',
    color: '#7c3aed',
    features: ['Unlimited integrations', '12-month data history', 'All dashboard pages', 'Unlimited PDF reports', 'Unlimited AI queries', 'Competitor Spy', 'Smart Alerts', 'Auto-sync daily'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Agency',
    price: '$149',
    period: 'per month',
    desc: 'For agencies managing multiple clients',
    color: '#22c55e',
    features: ['Everything in Pro', 'Up to 10 workspaces', 'White-label reports', 'Client sharing links', 'Priority support', 'Custom branding', 'API access'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard');
    });
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', color: '#F8FAFC', fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-1px' }}>
          <span style={{ color: '#7C3AED' }}>L</span><span style={{ color: '#F8FAFC' }}>umnix</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="#features" style={{ padding: '8px 16px', color: '#94A3B8', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>Features</a>
          <a href="#pricing" style={{ padding: '8px 16px', color: '#94A3B8', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>Pricing</a>
          <button onClick={() => router.push('/auth/signin')} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94A3B8', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            Sign In
          </button>
          <button onClick={() => router.push('/auth/signup')} style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 40px 80px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, backgroundColor: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', marginBottom: 28 }}>
          <Zap size={12} color="#a78bfa" />
          <span style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600 }}>Now with AI-powered insights</span>
        </div>
        <h1 style={{ fontSize: 58, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 22, fontFamily: 'var(--font-display)' }}>
          One dashboard for all<br />
          <span style={{ background: 'linear-gradient(135deg, #7C3AED, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>your marketing data</span>
        </h1>
        <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.7, marginBottom: 38, maxWidth: 560, margin: '0 auto 38px' }}>
          Connect GSC, GA4, Google Ads, and Meta Ads. Get AI-powered insights, competitor intelligence, and client-ready PDF reports — all in one place.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/auth/signup')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 30px rgba(124,58,237,0.4)' }}>
            Get Started Free <ArrowRight size={16} />
          </button>
          <button onClick={() => router.push('/auth/signin')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, border: '1px solid #334155', backgroundColor: 'transparent', color: '#94A3B8', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            View Demo
          </button>
        </div>
        <p style={{ fontSize: 13, color: '#475569', marginTop: 18 }}>No credit card required · Free plan forever · Setup in 5 minutes</p>
      </section>

      {/* Social Proof Bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 48, padding: '28px 40px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
        {[['500+', 'Marketers using Lumnix'], ['4 sources', 'GSC · GA4 · Google Ads · Meta'], ['1-click', 'PDF client reports'], ['< 5min', 'Average setup time']].map(([val, label]) => (
          <div key={val} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.5px' }}>{val}</div>
            <div style={{ fontSize: 12, color: '#52525b', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <section id="features" style={{ padding: '90px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px', marginBottom: 14 }}>Everything you need.<br />Nothing you don't.</h2>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 480, margin: '0 auto' }}>Built for founders and marketing teams who are tired of jumping between tools.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 16, padding: 28, transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${f.color}50`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#27272a')}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <f.icon size={20} color={f.color} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f4f4f5', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#71717a', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 40px', backgroundColor: '#0d1424', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 10 }}>Trusted by 500+ marketers</h2>
            <p style={{ fontSize: 15, color: '#64748B' }}>Real teams. Real results.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 16, padding: 28 }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[...Array(t.rating)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f4f4f5' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#52525b' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '90px 40px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px', marginBottom: 12 }}>Simple, transparent pricing</h2>
          <p style={{ fontSize: 16, color: '#64748B' }}>Start free. Upgrade when you're ready.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}>
          {PRICING.map(p => (
            <div key={p.name} style={{ backgroundColor: '#18181b', border: `1px solid ${p.highlight ? p.color + '60' : '#27272a'}`, borderRadius: 18, padding: 30, position: 'relative', boxShadow: p.highlight ? `0 0 40px ${p.color}20` : 'none' }}>
              {p.highlight && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', backgroundColor: p.color, color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20 }}>MOST POPULAR</div>}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 38, fontWeight: 900, color: '#f4f4f5', letterSpacing: '-1px' }}>{p.price}</span>
                  <span style={{ fontSize: 14, color: '#52525b', marginBottom: 6 }}>/{p.period}</span>
                </div>
                <p style={{ fontSize: 13, color: '#71717a' }}>{p.desc}</p>
              </div>
              <div style={{ marginBottom: 26 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Check size={14} color={p.color} strokeWidth={2.5} />
                    <span style={{ fontSize: 13, color: '#a1a1aa' }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/auth/signup')} style={{ width: '100%', padding: '12px', borderRadius: 10, border: p.highlight ? 'none' : `1px solid ${p.color}40`, background: p.highlight ? `linear-gradient(135deg, ${p.color}, #4C1D95)` : 'transparent', color: p.highlight ? 'white' : p.color, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: p.highlight ? `0 4px 20px ${p.color}40` : 'none' }}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '80px 40px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(59,130,246,0.08))', borderTop: '1px solid rgba(124,58,237,0.2)' }}>
        <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-1px', marginBottom: 14 }}>Ready to stop juggling tabs?</h2>
        <p style={{ fontSize: 16, color: '#94A3B8', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>Join 500+ marketers who replaced 6 tools with one dashboard. Free to start.</p>
        <button onClick={() => router.push('/auth/signup')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 30px rgba(124,58,237,0.4)' }}>
          Get Started Free <ArrowRight size={18} />
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding: '36px 40px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          <span style={{ color: '#7C3AED' }}>L</span><span style={{ color: '#64748B' }}>umnix</span>
        </span>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Support', 'Status'].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <span style={{ fontSize: 12, color: '#334155' }}>© 2026 Lumnix. All rights reserved.</span>
      </footer>
    </div>
  );
}
