'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ThemeProvider, useTheme } from '@/lib/theme';

function ResetInner() {
  const { c } = useTheme();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

  useEffect(() => {
    // The recovery link from email contains a token Supabase exchanges automatically.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setHasRecoverySession(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasRecoverySession(true);
      else setHasRecoverySession(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 1500);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: 'var(--font-body)', backgroundColor: c.bgPage }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: c.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px', marginBottom: 6 }}>
          Set a new password
        </h1>
        <p style={{ fontSize: 14, color: c.textSecondary, marginBottom: 28 }}>
          Choose something you'll remember — at least 8 characters.
        </p>

        {hasRecoverySession === false ? (
          <div role="alert" style={{ padding: '14px 16px', borderRadius: 10, background: c.dangerSubtle, border: `1px solid ${c.dangerBorder}`, color: c.danger, fontSize: 13, lineHeight: 1.5 }}>
            This reset link is invalid or expired. <a href="/auth/forgot" style={{ color: c.danger, textDecoration: 'underline', fontWeight: 600 }}>Request a new one</a>.
          </div>
        ) : done ? (
          <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <Check size={18} color="#16A34A" />
            <p style={{ fontSize: 14, color: c.text }}>Password updated. Redirecting…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <label htmlFor="reset-pwd" className="sr-only">New password</label>
              <Lock size={15} aria-hidden="true" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: c.textMuted, pointerEvents: 'none' }} />
              <input
                id="reset-pwd" name="new-password" type={showPwd ? 'text' : 'password'} required autoComplete="new-password" autoFocus minLength={8}
                placeholder="New password…" value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '11px 40px 11px 40px', borderRadius: 10, border: `1px solid ${c.border}`, backgroundColor: c.bgCard, color: c.text, fontSize: 14, boxSizing: 'border-box', fontFamily: 'var(--font-body)', outline: 'none' }}
              />
              <button type="button" aria-label={showPwd ? 'Hide password' : 'Show password'} onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: 2, display: 'flex' }}>
                {showPwd ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <label htmlFor="reset-confirm" className="sr-only">Confirm new password</label>
              <Lock size={15} aria-hidden="true" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: c.textMuted, pointerEvents: 'none' }} />
              <input
                id="reset-confirm" name="confirm-password" type={showPwd ? 'text' : 'password'} required autoComplete="new-password" minLength={8}
                placeholder="Confirm password…" value={confirm} onChange={e => setConfirm(e.target.value)}
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10, border: `1px solid ${c.border}`, backgroundColor: c.bgCard, color: c.text, fontSize: 14, boxSizing: 'border-box', fontFamily: 'var(--font-body)', outline: 'none' }}
              />
            </div>
            {error && (
              <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: c.dangerSubtle, border: `1px solid ${c.dangerBorder}`, color: c.danger, fontSize: 13 }}>{error}</div>
            )}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >{loading ? 'Updating…' : 'Update password'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <ThemeProvider><ResetInner /></ThemeProvider>;
}
