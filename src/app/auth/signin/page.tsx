'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ThemeProvider, useTheme } from '@/lib/theme';

// Only allow redirects to same-origin relative paths.
function safeRedirect(target: string | null): string {
  if (!target) return '/dashboard';
  if (!target.startsWith('/') || target.startsWith('//')) return '/dashboard';
  return target;
}

function SignInInner() {
  const { c } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const messageParam = searchParams.get('message');
  const postSignInTarget = safeRedirect(redirectParam);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(messageParam || '');

  useEffect(() => {
    // Check existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { router.push(postSignInTarget); return; }
    });

    // Listen for auth state changes (handles OAuth callbacks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) router.push(postSignInTarget);
    });

    return () => subscription.unsubscribe();
  }, [router, postSignInTarget]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("That doesn't look like a valid email address.");
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      // Generic message — don't reveal which field is wrong.
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }
    router.push(postSignInTarget);
  }

  async function handleGoogleSignIn() {
    const callback = new URL('/auth/callback', window.location.origin);
    if (redirectParam && postSignInTarget !== '/dashboard') {
      callback.searchParams.set('redirect', postSignInTarget);
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback.toString() }
    });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-body)', backgroundColor: c.bgPage }}>

      {/* Left panel */}
      <div style={{
        flex: '0 0 45%', display: 'none', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px', backgroundColor: c.bgPage,
        borderRight: `1px solid ${c.border}`, position: 'relative', overflow: 'hidden',
      }} className="auth-left-panel">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 50% at 20% 20%, rgba(124,58,237,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 80% 80%, rgba(8,145,178,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 50% 50%, rgba(124,58,237,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div>
          <span style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.05em', fontFamily: 'var(--font-display)', color: c.text }}>
            Lumnix
          </span>
        </div>

        <div>
          <blockquote style={{ fontSize: '22px', fontWeight: 700, color: c.text, lineHeight: 1.4, letterSpacing: '-0.5px', fontFamily: 'var(--font-display)', marginBottom: '16px', fontStyle: 'normal' }}>
            &ldquo;Lumnix changed how we look at our marketing. Everything in one place &mdash; finally.&rdquo;
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: c.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: c.accent }}>S</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: c.textSecondary }}>Sarah K.</div>
              <div style={{ fontSize: '12px', color: c.textMuted }}>Head of Growth, D2C Brand</div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: c.textMuted }}>&copy; 2026 Oltaflock AI &middot; All rights reserved</p>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <div style={{ marginBottom: '32px' }} className="auth-mobile-logo">
            <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1.5px', fontFamily: 'var(--font-display)' }}>
              <span style={{ color: c.accent }}>L</span><span style={{ color: c.text }}>umnix</span>
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, color: c.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px', marginBottom: '6px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '14px', color: c.textSecondary, marginBottom: '28px' }}>
            Sign in to your Lumnix workspace
          </p>

          <button
            onClick={handleGoogleSignIn}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', padding: '11px 16px', borderRadius: '10px',
              border: `1px solid ${c.border}`, backgroundColor: c.bgCard,
              color: c.text, fontSize: '14px', fontWeight: 500,
              cursor: 'pointer', marginBottom: '20px', transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCardHover}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCard}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <label htmlFor="signin-email" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Email</label>
              <Mail size={15} aria-hidden="true" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: c.textMuted, pointerEvents: 'none' }} />
              <input
                id="signin-email" name="email" autoComplete="email" spellCheck={false}
                inputMode="email" autoCapitalize="none" autoCorrect="off"
                type="email" placeholder="Work email…" value={email}
                onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: '10px', border: `1px solid ${c.border}`, backgroundColor: c.bgCard, color: c.text, fontSize: '14px', boxSizing: 'border-box', fontFamily: 'var(--font-body)', transition: 'border-color 0.15s' } as React.CSSProperties}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <label htmlFor="signin-password" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Password</label>
              <Lock size={15} aria-hidden="true" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: c.textMuted, pointerEvents: 'none' }} />
              <input
                id="signin-password" name="password" autoComplete="current-password"
                type={showPassword ? 'text' : 'password'} placeholder="Password…" value={password}
                onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', padding: '11px 40px 11px 40px', borderRadius: '10px', border: `1px solid ${c.border}`, backgroundColor: c.bgCard, color: c.text, fontSize: '14px', boxSizing: 'border-box', fontFamily: 'var(--font-body)', transition: 'border-color 0.15s' } as React.CSSProperties}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
              />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: '2px', display: 'flex' }}>
                {showPassword ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6 }}>
              <a href="/auth/forgot" style={{ fontSize: 12, color: c.textSecondary, textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>

            {error && (
              <div role="alert" style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: c.dangerSubtle, border: `1px solid ${c.dangerBorder}`, color: c.danger, fontSize: '13px' }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: 'none', background: '#7C3AED', boxShadow: '0 2px 16px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'box-shadow 0.15s, transform 0.16s cubic-bezier(0.23,1,0.32,1)', marginTop: '4px' }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.background = '#6D28D9'; } }}
              onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 16px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.background = '#7C3AED'; } }}
            >
              {loading ? 'Signing in...' : (<>Sign in <ArrowRight size={15} /></>)}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: c.textMuted }}>
            No account?{' '}
            <a href="/auth/signup" style={{ color: c.accent, fontWeight: 500, textDecoration: 'none' }}>Sign up free</a>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) { .auth-left-panel { display: flex !important; } .auth-mobile-logo { display: none !important; } }
      `}</style>
    </div>
  );
}

export default function SignInPage() {
  return (
    <ThemeProvider>
      <SignInInner />
    </ThemeProvider>
  );
}
