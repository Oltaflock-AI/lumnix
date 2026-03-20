'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BarChart3, Target, Brain, Zap, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard');
    });
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #1E293B' }}>
        <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-1.5px', fontFamily: 'var(--font-display)' }}>
          <span style={{ color: '#7C3AED' }}>L</span><span style={{ color: '#F8FAFC' }}>umnix</span>
        </span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => router.push('/auth/signin')} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94A3B8', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Sign In
          </button>
          <button onClick={() => router.push('/auth/signup')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.3)', fontFamily: 'var(--font-body)' }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(124,58,237,0.3)', backgroundColor: 'rgba(124,58,237,0.1)', marginBottom: '24px' }}>
          <Brain size={14} color="#A78BFA" />
          <span style={{ fontSize: '13px', color: '#A78BFA', fontWeight: 500 }}>AI-Powered Marketing Intelligence</span>
        </div>

        <h1 style={{ fontSize: '56px', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.1, letterSpacing: '-1.5px', maxWidth: '800px', marginBottom: '20px', fontFamily: 'var(--font-display)' }}>
          All your marketing data.{' '}
          <span style={{ background: 'linear-gradient(135deg, #7C3AED, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            One powerful dashboard.
          </span>
        </h1>

        <p style={{ fontSize: '18px', color: '#64748B', maxWidth: '560px', lineHeight: 1.6, marginBottom: '36px' }}>
          Connect Google Search Console, GA4, Google Ads, and Meta Ads. Get AI-powered insights, anomaly alerts, and competitor intelligence — all in one place.
        </p>

        <button onClick={() => router.push('/auth/signup')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', color: 'white', fontSize: '16px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 32px rgba(124,58,237,0.4)', fontFamily: 'var(--font-body)' }}>
          Start Free <ArrowRight size={18} />
        </button>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '60px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: BarChart3, label: 'GSC + GA4 Analytics' },
            { icon: Target, label: 'Google & Meta Ads' },
            { icon: Brain, label: 'AI Insights & Forecasting' },
            { icon: Zap, label: 'Competitor Ad Spy' },
          ].map((f) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1E293B' }}>
              <f.icon size={16} color="#A78BFA" />
              <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500, fontFamily: 'var(--font-body)' }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #1E293B' }}>
        <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'var(--font-body)' }}>© 2026 Lumnix by Oltaflock AI. All rights reserved.</span>
      </div>
    </div>
  );
}
