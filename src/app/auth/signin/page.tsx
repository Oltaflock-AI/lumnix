'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { router.push('/dashboard'); return; }
    });

    // Listen for auth state changes (handles OAuth callbacks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) router.push('/dashboard');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/dashboard');
  }

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-body)', backgroundColor: '#0F172A' }}>

      {/* Left panel */}
      <div style={{
        flex: '0 0 45%', display: 'none', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px', background: 'linear-gradient(135deg, #0F172A 0%, #1a1040 100%)',
        borderRight: '1px solid #1E293B', position: 'relative', overflow: 'hidden',
      }} className="auth-left-panel">
        <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(8,145,178,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div>
          <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1.5px', fontFamily: 'var(--font-display)' }}>
            <span style={{ color: '#7C3AED' }}>L</span><span style={{ color: '#F8FAFC' }}>umnix</span>
          </span>
        </div>

        <div>
          <blockquote style={{ fontSize: '22px', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.4, letterSpacing: '-0.5px', fontFamily: 'var(--font-display)', marginBottom: '16px', fontStyle: 'normal' }}>
            "Lumnix changed how we look at our marketing. Everything in one place — finally."
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#A78BFA' }}>S</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>Sarah K.</div>
              <div style={{ fontSize: '12px', color: '#475569' }}>Head of Growth, D2C Brand</div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#334155' }}>© 2026 Oltaflock AI · All rights reserved</p>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <div style={{ marginBottom: '32px' }} className="auth-mobile-logo">
            <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1.5px', fontFamily: 'var(--font-display)' }}>
              <span style={{ color: '#7C3AED' }}>L</span><span style={{ color: '#F8FAFC' }}>umnix</span>
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F8FAFC', fontFamily: 'var(--font-display)', letterSpacing: '-0.5px', marginBottom: '6px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '28px' }}>
            Sign in to your Lumnix workspace
          </p>

          <button
            onClick={handleGoogleSignIn}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', padding: '11px 16px', borderRadius: '8px',
              border: '1px solid #334155', backgroundColor: '#1E293B',
              color: '#CBD5E1', fontSize: '14px', fontWeight: 500,
              cursor: 'pointer', marginBottom: '20px', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#475569'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#334155'}
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
            <div style={{ flex: 1, height: '1px', backgroundColor: '#1E293B' }} />
            <span style={{ fontSize: '12px', color: '#475569' }}>or continue with email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#1E293B' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
              <input
                type="email" placeholder="Work email" value={email}
                onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#F8FAFC', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)', transition: 'border-color 0.15s' } as React.CSSProperties}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#7C3AED'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#334155'}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
              <input
                type={showPassword ? 'text' : 'password'} placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', padding: '11px 40px 11px 40px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#F8FAFC', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)', transition: 'border-color 0.15s' } as React.CSSProperties}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#7C3AED'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#334155'}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px', display: 'flex' }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#7C3AED', color: 'white', fontSize: '14px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background-color 0.15s', marginTop: '4px' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6D28D9'; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#7C3AED'; }}
            >
              {loading ? 'Signing in...' : (<>Sign in <ArrowRight size={15} /></>)}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#475569' }}>
            No account?{' '}
            <a href="/auth/signup" style={{ color: '#A78BFA', fontWeight: 500, textDecoration: 'none' }}>Sign up free</a>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) { .auth-left-panel { display: flex !important; } .auth-mobile-logo { display: none !important; } }
      `}</style>
    </div>
  );
}
