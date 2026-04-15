'use client';
import { useState } from 'react';
import { Mail, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ThemeProvider, useTheme } from '@/lib/theme';

function ForgotInner() {
  const { c } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("That doesn't look like a valid email address.");
      return;
    }
    setLoading(true); setError('');
    const startedAt = Date.now();
    // Fire reset — but we intentionally never surface success/failure
    // to the UI. Errors are logged to the browser console only so that
    // the response does not reveal whether the email exists.
    supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/auth/reset`,
    }).catch((e) => { if (process.env.NODE_ENV !== 'production') console.debug('reset error', e); });
    // Pad to a constant 1.5s to mask timing differences.
    const padMs = Math.max(0, 1500 - (Date.now() - startedAt));
    await new Promise((r) => setTimeout(r, padMs));
    setLoading(false);
    setSent(true);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: 'var(--font-body)', backgroundColor: c.bgPage }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <a href="/auth/signin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: c.textSecondary, textDecoration: 'none', marginBottom: 24 }}>
          <ArrowLeft size={14} /> Back to sign in
        </a>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: c.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px', marginBottom: 6 }}>
          Reset your password
        </h1>
        <p style={{ fontSize: 14, color: c.textSecondary, marginBottom: 28 }}>
          Enter your email and we'll send you a reset link.
        </p>

        {sent ? (
          <div role="status" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 18px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={16} color="#16A34A" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 4 }}>Check your inbox</p>
              <p style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.5 }}>
                If an account exists for that address, a reset link is on its way. It expires in 1 hour.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <label htmlFor="forgot-email" className="sr-only">Email</label>
              <Mail size={15} aria-hidden="true" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: c.textMuted, pointerEvents: 'none' }} />
              <input
                id="forgot-email" name="email" type="email" required autoComplete="email"
                inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoFocus
                placeholder="Work email…" value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10, border: `1px solid ${c.border}`, backgroundColor: c.bgCard, color: c.text, fontSize: 14, boxSizing: 'border-box', fontFamily: 'var(--font-body)', outline: 'none' }}
              />
            </div>
            {error && (
              <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: c.dangerSubtle, border: `1px solid ${c.dangerBorder}`, color: c.danger, fontSize: 13 }}>{error}</div>
            )}
            <button
              type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >{loading ? 'Sending…' : 'Send reset link'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return <ThemeProvider><ForgotInner /></ThemeProvider>;
}
