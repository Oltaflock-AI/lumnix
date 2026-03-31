'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Zap, BarChart3, Brain, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { Suspense } from 'react';

const features = [
  { icon: BarChart3, text: 'Unified GA4 + GSC + Ads analytics' },
  { icon: Brain, text: 'AI-powered insights & anomaly alerts' },
  { icon: Zap, text: 'Competitor ad spy & intelligence' },
];

function SignUpInner() {
  const { c } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const couponFromUrl = searchParams.get('coupon') || '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.session) {
      try { await fetch('/api/workspace', { headers: { Authorization: `Bearer ${data.session.access_token}` } }); } catch {}
    }
    const onboardingUrl = couponFromUrl ? `/onboarding?coupon=${encodeURIComponent(couponFromUrl)}` : '/onboarding';
    router.push(onboardingUrl);
  }

  async function handleGoogleSignUp() {
    // Store coupon in localStorage so we can retrieve it after OAuth redirect
    if (couponFromUrl) localStorage.setItem('lumnix-coupon', couponFromUrl);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` }
    });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-body)', backgroundColor: c.bgPage }}>

      {/* Left panel — brand */}
      <div style={{
        flex: '0 0 45%', display: 'none', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px', backgroundColor: c.bgPage,
        borderRight: `1px solid ${c.border}`, position: 'relative', overflow: 'hidden',
      }} className="auth-left-panel">
        {/* Glow */}
        <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div>
          <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1.5px', fontFamily: 'var(--font-display)' }}>
            <span style={{ color: c.accent }}>L</span><span style={{ color: c.text }}>umnix</span>
          </span>
        </div>

        {/* Headline */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: c.accentSubtle, border: '1px solid rgba(99,102,241,0.2)', marginBottom: '20px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.accent, display: 'inline-block' }} />
            <span style={{ fontSize: '12px', color: c.accent, fontWeight: 600, letterSpacing: '0.5px' }}>MARKETING INTELLIGENCE</span>
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: c.text, lineHeight: 1.2, letterSpacing: '-1px', fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
            Your marketing data,<br />
            <span style={{ color: c.accent }}>finally unified.</span>
          </h2>
          <p style={{ fontSize: '15px', color: c.textSecondary, lineHeight: 1.6, marginBottom: '32px' }}>
            Connect GA4, Search Console, Google Ads, and Meta Ads into one AI-powered intelligence platform.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: c.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <f.icon size={15} color={c.accent} />
                </div>
                <span style={{ fontSize: '14px', color: c.textSecondary }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '12px', color: c.textMuted }}>&copy; 2026 Oltaflock AI &middot; All rights reserved</p>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Mobile logo */}
          <div style={{ marginBottom: '32px' }} className="auth-mobile-logo">
            <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1.5px', fontFamily: 'var(--font-display)' }}>
              <span style={{ color: c.accent }}>L</span><span style={{ color: c.text }}>umnix</span>
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, color: c.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px', marginBottom: '6px' }}>
            Create your account
          </h1>
          <p style={{ fontSize: '14px', color: c.textSecondary, marginBottom: couponFromUrl ? '16px' : '28px' }}>
            Free to start &middot; No credit card needed
          </p>

          {couponFromUrl && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', borderRadius: '10px', marginBottom: '24px',
              backgroundColor: c.successSubtle, border: `1px solid ${c.successBorder}`,
            }}>
              <Gift size={16} color={c.success} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: c.success }}>Coupon applied: {couponFromUrl}</div>
                <div style={{ fontSize: '12px', color: c.textSecondary, marginTop: '2px' }}>Your plan will be upgraded after signup</div>
              </div>
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogleSignUp}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', padding: '11px 16px', borderRadius: '8px',
              border: `1px solid ${c.border}`, backgroundColor: c.bgCard,
              color: c.text, fontSize: '14px', fontWeight: 500,
              cursor: 'pointer', marginBottom: '20px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCardHover}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCard}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: c.border }} />
            <span style={{ fontSize: '12px', color: c.textMuted }}>or continue with email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: c.border }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { icon: User, type: 'text', placeholder: 'Full name', value: name, onChange: setName },
              { icon: Mail, type: 'email', placeholder: 'Work email', value: email, onChange: setEmail },
              { icon: Lock, type: 'password', placeholder: 'Password (min 6 chars)', value: password, onChange: setPassword, min: 6 },
            ].map((field, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <field.icon size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: c.textMuted, pointerEvents: 'none' }} />
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  required
                  minLength={field.min}
                  style={{
                    width: '100%', padding: '11px 14px 11px 40px',
                    borderRadius: '8px', border: `1px solid ${c.border}`,
                    backgroundColor: c.bgCard, color: c.text,
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'var(--font-body)', transition: 'border-color 0.15s',
                  } as React.CSSProperties}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
                />
              </div>
            ))}

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: c.dangerSubtle, border: `1px solid ${c.dangerBorder}`, color: c.danger, fontSize: '13px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none',
                backgroundColor: c.accent, color: 'white', fontSize: '14px', fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'background-color 0.15s', marginTop: '4px',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.accentHover; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.accent; }}
            >
              {loading ? 'Creating account...' : (<>Create account <ArrowRight size={15} /></>)}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: c.textMuted }}>
            Already have an account?{' '}
            <a href="/auth/signin" style={{ color: c.accent, fontWeight: 500, textDecoration: 'none' }}>Sign in</a>
          </p>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: c.textMuted, lineHeight: 1.6 }}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) { .auth-left-panel { display: flex !important; } .auth-mobile-logo { display: none !important; } }
      `}</style>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <ThemeProvider>
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <SignUpInner />
      </Suspense>
    </ThemeProvider>
  );
}
