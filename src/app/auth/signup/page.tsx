'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) { setError(error.message); setLoading(false); return; }

    // Auto-create workspace for new user
    if (data.session) {
      try {
        await fetch('/api/workspace', {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
      } catch {}
    }

    router.push('/dashboard');
  }

  async function handleGoogleSignUp() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` }
    });
  }

  const inputStyle = { width: '100%', padding: '12px 14px 12px 42px', borderRadius: '10px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Zap size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f4f4f5' }}>Create your account</h1>
          <p style={{ fontSize: '14px', color: '#71717a', marginTop: '4px' }}>Start with Krato for free</p>
        </div>

        <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '28px' }}>
          <button onClick={handleGoogleSignUp} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: '#d4d4d8', fontSize: '14px', fontWeight: 500, cursor: 'pointer', marginBottom: '20px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a' }} />
            <span style={{ fontSize: '12px', color: '#52525b' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#71717a' }} />
              <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
            </div>
            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#71717a' }} />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
            </div>
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#71717a' }} />
              <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required minLength={6} />
            </div>

            {error && <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '13px' }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#71717a' }}>
          Already have an account?{' '}
          <a href="/auth/signin" style={{ color: '#a78bfa', fontWeight: 500, textDecoration: 'none' }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
