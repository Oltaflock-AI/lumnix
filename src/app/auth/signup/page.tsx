'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function SignUpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const couponFromUrl = searchParams.get('coupon') || '';
  const inviteFromUrl = searchParams.get('invite') || '';
  const teamInviteToken = searchParams.get('team_invite') || '';
  const prefillEmail = searchParams.get('email') || '';

  useEffect(() => { if (inviteFromUrl) setInviteCode(inviteFromUrl); }, [inviteFromUrl]);
  useEffect(() => { if (prefillEmail) setEmail(prefillEmail); }, [prefillEmail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 12) { setError('Password must be at least 12 characters.'); return; }
    setLoading(true);
    setError('');

    const code = inviteCode.trim();
    if (code) {
      try {
        const vRes = await fetch('/api/beta/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const vData = await vRes.json();
        if (!vData.valid) { setError(vData.error || 'Invalid invite code'); setLoading(false); return; }
      } catch {
        setError('Could not validate invite code'); setLoading(false); return;
      }
    }

    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.session) {
      let workspaceId: string | undefined;
      try {
        const wsRes = await fetch('/api/workspace', { headers: { Authorization: `Bearer ${data.session.access_token}` } });
        const wsData = await wsRes.json();
        workspaceId = wsData?.workspaces?.[0]?.id || wsData?.id;
      } catch {}
      try { fetch('/api/email/welcome', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: data.session.user.id, email, name, workspace_id: workspaceId }) }); } catch {}
      if (code) {
        try { fetch('/api/beta/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, email }) }); } catch {}
      }
      if (teamInviteToken && /^inv_[a-f0-9]+$/.test(teamInviteToken)) {
        try { await fetch(`/api/team/accept?token=${encodeURIComponent(teamInviteToken)}`, { redirect: 'manual' }); } catch {}
        router.push('/dashboard?invite_accepted=true');
        return;
      }
    }
    const onboardingUrl = couponFromUrl ? `/onboarding?coupon=${encodeURIComponent(couponFromUrl)}` : '/onboarding';
    router.push(onboardingUrl);
  }

  async function handleGoogleSignUp() {
    if (couponFromUrl) localStorage.setItem('lumnix-coupon', couponFromUrl);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent('/onboarding')}` }
    });
  }

  return (
    <div className="su-layout">
      {/* LEFT — Brand Panel */}
      <div className="su-left">
        <div className="su-left-bg">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="su-left-grid" />

        <div className="su-left-content">
          <a href="/" className="su-logo">
            <svg width="32" height="32" viewBox="0 0 88 88" fill="none" aria-hidden="true">
              <circle cx="44" cy="44" r="42" fill="#FF0066" />
              <rect x="24" y="18" width="12" height="52" rx="2" fill="white" />
              <rect x="24" y="58" width="36" height="12" rx="2" fill="white" />
              <rect x="46" y="36" width="20" height="3" rx="1.5" fill="white" opacity="0.7" />
              <rect x="46" y="43" width="20" height="3" rx="1.5" fill="white" opacity="0.7" />
              <rect x="46" y="50" width="14" height="3" rx="1.5" fill="white" opacity="0.7" />
            </svg>
            Lumnix
          </a>
        </div>

        <div className="su-left-content">
          <div className="su-badge">
            <span className="su-badge-dot" />
            Marketing Intelligence
          </div>

          <h1 className="su-headline">
            Your marketing data,<br />
            <span className="accent">finally unified.</span>
          </h1>

          <p className="su-subtitle">
            Connect GA4, Search Console, Google Ads, and Meta Ads into one AI-powered intelligence platform.
          </p>

          <div className="su-features">
            <div className="su-feature">
              <div className="su-feature-icon" style={{ background: 'rgba(255,0,102,0.10)', border: '1px solid rgba(255,0,102,0.15)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF0066" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
              </div>
              <span className="su-feature-text">Unified GA4 + GSC + Ads analytics</span>
            </div>
            <div className="su-feature">
              <div className="su-feature-icon" style={{ background: 'rgba(0,212,170,0.10)', border: '1px solid rgba(0,212,170,0.15)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v1H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-3-3z" /><circle cx="12" cy="13" r="3" /></svg>
              </div>
              <span className="su-feature-text">AI-powered insights & anomaly alerts</span>
            </div>
            <div className="su-feature">
              <div className="su-feature-icon" style={{ background: 'rgba(123,97,255,0.10)', border: '1px solid rgba(123,97,255,0.15)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B61FF" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              </div>
              <span className="su-feature-text">Competitor ad spy & intelligence</span>
            </div>
          </div>

          <div className="su-social-proof">
            <div className="su-avatar-stack">
              <span style={{ background: 'linear-gradient(135deg, #FF0066, #FF6699)' }}>K</span>
              <span style={{ background: 'linear-gradient(135deg, #00D4AA, #34D399)' }}>A</span>
              <span style={{ background: 'linear-gradient(135deg, #7B61FF, #A78BFA)' }}>R</span>
              <span style={{ background: 'linear-gradient(135deg, #FF8A00, #FBBF24)' }}>+</span>
            </div>
            <p className="su-proof-text">
              <strong>127 marketers</strong> joined this week.<br />
              Limited early access spots remaining.
            </p>
          </div>
        </div>

        <div className="su-preview-card">
          <div className="preview-header">
            <span className="preview-label">This Week</span>
            <span className="preview-live"><span className="preview-live-dot" /> LIVE</span>
          </div>
          <div className="preview-kpi">
            <div className="preview-kpi-item">
              <div className="preview-kpi-val">9.5K <span className="preview-kpi-change" style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399' }}>+12%</span></div>
              <div className="preview-kpi-label">Sessions</div>
            </div>
            <div className="preview-kpi-item">
              <div className="preview-kpi-val">4.2x <span className="preview-kpi-change" style={{ background: 'rgba(0,212,170,0.12)', color: '#00D4AA' }}>+23%</span></div>
              <div className="preview-kpi-label">ROAS</div>
            </div>
          </div>
          <div className="preview-bar-chart">
            {[
              { h: '45%', bg: 'rgba(255,0,102,0.4)', d: '0s' },
              { h: '65%', bg: 'rgba(255,0,102,0.5)', d: '0.05s' },
              { h: '40%', bg: 'rgba(255,0,102,0.35)', d: '0.1s' },
              { h: '80%', bg: 'rgba(255,0,102,0.6)', d: '0.15s' },
              { h: '55%', bg: 'rgba(255,0,102,0.45)', d: '0.2s' },
              { h: '90%', bg: '#FF0066', d: '0.25s' },
              { h: '70%', bg: 'rgba(255,0,102,0.55)', d: '0.3s' },
              { h: '100%', bg: '#FF0066', d: '0.35s' },
              { h: '75%', bg: 'rgba(255,0,102,0.5)', d: '0.4s' },
              { h: '60%', bg: 'rgba(255,0,102,0.4)', d: '0.45s' },
            ].map((b, i) => (
              <div key={i} className="preview-bar" style={{ height: b.h, background: b.bg, animationDelay: b.d }} />
            ))}
          </div>
        </div>

        <div className="su-preview-card-2">
          <div className="preview2-row">
            <div className="preview2-icon">
              <svg viewBox="0 0 120 120" fill="none" width="22" height="22" aria-hidden="true">
                <defs><radialGradient id="lg-mini" cx="40%" cy="40%" r="60%"><stop offset="0%" stopColor="#FFF" stopOpacity="1" /><stop offset="60%" stopColor="#FFB3D9" stopOpacity="0.8" /><stop offset="100%" stopColor="#FF0066" stopOpacity="0.6" /></radialGradient></defs>
                <circle cx="60" cy="60" r="35" fill="url(#lg-mini)" />
                <circle cx="50" cy="55" r="3" fill="white" /><circle cx="70" cy="55" r="3" fill="white" />
                <path d="M50 65Q60 71 70 65" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
              </svg>
            </div>
            <p className="preview2-text">
              <strong>Lumi found 3 quick wins</strong> on page 1 that could add ~20 clicks/week
            </p>
          </div>
        </div>

        <p className="su-footer">&copy; 2026 Oltaflock AI &middot; All rights reserved</p>
      </div>

      {/* RIGHT — Form Panel */}
      <div className="su-right">
        <div className="su-form-wrap">
          <div className="su-mobile-logo">
            <svg width="28" height="28" viewBox="0 0 88 88" fill="none" aria-hidden="true">
              <circle cx="44" cy="44" r="42" fill="#FF0066" />
              <rect x="24" y="18" width="12" height="52" rx="2" fill="white" />
              <rect x="24" y="58" width="36" height="12" rx="2" fill="white" />
              <rect x="46" y="36" width="20" height="3" rx="1.5" fill="white" opacity="0.7" />
              <rect x="46" y="43" width="20" height="3" rx="1.5" fill="white" opacity="0.7" />
              <rect x="46" y="50" width="14" height="3" rx="1.5" fill="white" opacity="0.7" />
            </svg>
            Lumnix
          </div>

          <h1 className="su-form-title">Create your account</h1>
          <p className="su-form-sub">Free to start &middot; No credit card needed</p>

          {couponFromUrl && (
            <div className="su-coupon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
              <div>
                <div className="su-coupon-title">Coupon applied: {couponFromUrl}</div>
                <div className="su-coupon-sub">Your plan will be upgraded after signup</div>
              </div>
            </div>
          )}

          <button className="su-google-btn" type="button" onClick={handleGoogleSignUp}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="su-divider">
            <div className="su-divider-line" />
            <span className="su-divider-text">or continue with email</span>
            <div className="su-divider-line" />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="su-field">
              <label htmlFor="signup-name" className="sr-only">Full name</label>
              <svg className="su-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              <input id="signup-name" name="name" autoComplete="name" className="su-input" type="text" placeholder="Full name..." required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="su-field">
              <label htmlFor="signup-email" className="sr-only">Work email</label>
              <svg className="su-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              <input id="signup-email" name="email" autoComplete="email" spellCheck={false} className="su-input" type="email" placeholder="Work email..." required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="su-field">
              <label htmlFor="signup-password" className="sr-only">Password</label>
              <svg className="su-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <input id="signup-password" name="new-password" autoComplete="new-password" className="su-input" type="password" placeholder="Password (min 12 chars)..." required minLength={12} value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="su-field">
              <label htmlFor="signup-invite" className="sr-only">Beta invite code</label>
              <svg className="su-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>
              <input id="signup-invite" name="invite-code" autoComplete="off" spellCheck={false} className="su-input" type="text" placeholder="Beta invite code (optional)..." value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
            </div>

            {error && <div role="alert" className="su-error">{error}</div>}

            <button className="su-submit" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : (
                <>
                  Create account
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </>
              )}
            </button>
          </form>

          <p className="su-bottom-text">
            Already have an account? <a href="/auth/signin" className="su-link">Sign in</a>
          </p>

          <p className="su-legal">
            By creating an account you agree to our{' '}
            <a href="/legal/terms">Terms of Service</a> and <a href="/legal/privacy">Privacy Policy</a>.
          </p>
        </div>
      </div>

      <style>{`
        .su-layout {
          --su-primary: #FF0066;
          --su-primary-hover: #E6005C;
          --su-secondary: #00D4AA;
          --su-tertiary: #7B61FF;
          --su-bg: #0A0A0F;
          --su-surface: #13131A;
          --su-elevated: #1A1A24;
          --su-hover: #22222E;
          --su-text: #F0F0F5;
          --su-text-sec: rgba(240,240,245,0.65);
          --su-text-muted: rgba(240,240,245,0.40);
          --su-border: rgba(255,255,255,0.07);
          --su-border-strong: rgba(255,255,255,0.12);
          --su-ease: cubic-bezier(0.23, 1, 0.32, 1);
          min-height: 100vh; display: flex;
          font-family: var(--font-body, 'Plus Jakarta Sans', system-ui, sans-serif);
          font-size: 14px;
          background: var(--su-bg);
          color: var(--su-text);
          -webkit-font-smoothing: antialiased;
        }
        .su-layout a { color: inherit; text-decoration: none; }
        .su-layout .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

        .su-left {
          flex: 0 0 48%; display: none; flex-direction: column;
          justify-content: space-between; padding: 48px;
          background: var(--su-bg); position: relative; overflow: hidden;
        }
        @media (min-width: 900px) { .su-left { display: flex; } }

        .su-left-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .su-left-bg .orb { position: absolute; border-radius: 50%; filter: blur(80px); }
        .su-left-bg .orb-1 { width: 500px; height: 500px; top: -10%; left: -10%; background: rgba(255,0,102,0.12); animation: su-orb-drift 8s ease-in-out infinite; }
        .su-left-bg .orb-2 { width: 400px; height: 400px; bottom: -5%; right: -5%; background: rgba(0,212,170,0.08); animation: su-orb-drift 10s ease-in-out infinite 3s; }
        .su-left-bg .orb-3 { width: 300px; height: 300px; top: 40%; left: 50%; background: rgba(123,97,255,0.06); animation: su-orb-drift 7s ease-in-out infinite 1.5s; }
        @keyframes su-orb-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -15px) scale(1.05); }
          66% { transform: translate(-10px, 10px) scale(0.95); }
        }

        .su-left-grid {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 70%);
                  mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 70%);
        }

        .su-left-content { position: relative; z-index: 2; }

        .su-logo {
          display: flex; align-items: center; gap: 12px;
          font-family: var(--font-display, 'Outfit', system-ui, sans-serif);
          font-weight: 900; font-size: 24px; letter-spacing: -0.04em; color: #fff;
        }
        .su-logo svg { flex-shrink: 0; }

        .su-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 100px; margin-bottom: 24px;
          background: rgba(255,0,102,0.08); border: 1px solid rgba(255,0,102,0.18);
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #FF6699;
          font-family: var(--font-display, 'Outfit', system-ui, sans-serif);
        }
        .su-badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--su-primary);
          animation: su-pulse-dot 2s ease-in-out infinite;
        }
        @keyframes su-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .su-headline {
          font-family: var(--font-display, 'Outfit', system-ui, sans-serif);
          font-size: clamp(36px, 4vw, 48px); font-weight: 900;
          letter-spacing: -0.04em; line-height: 1.1; margin-bottom: 20px;
        }
        .su-headline .accent { color: var(--su-primary); }

        .su-subtitle {
          font-size: 16px; color: var(--su-text-sec); line-height: 1.65;
          margin-bottom: 40px; max-width: 440px;
        }

        .su-features { display: flex; flex-direction: column; gap: 16px; }
        .su-feature {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px; border-radius: 14px;
          background: rgba(255,255,255,0.025); border: 1px solid var(--su-border);
          transition: all 0.3s var(--su-ease);
        }
        .su-feature:hover {
          background: rgba(255,0,102,0.04); border-color: rgba(255,0,102,0.15);
          transform: translateX(6px);
        }
        .su-feature-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .su-feature-text { font-size: 14px; color: var(--su-text-sec); font-weight: 600; }
        .su-feature:hover .su-feature-text { color: #fff; }

        .su-social-proof {
          display: flex; align-items: center; gap: 16px;
          padding: 20px 0; border-top: 1px solid var(--su-border); margin-top: 40px;
        }
        .su-avatar-stack { display: flex; margin-right: -4px; }
        .su-avatar-stack span {
          width: 32px; height: 32px; border-radius: 50%;
          border: 2px solid var(--su-bg);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: #fff; margin-left: -8px;
          font-family: var(--font-display, 'Outfit', system-ui, sans-serif);
        }
        .su-avatar-stack span:first-child { margin-left: 0; }
        .su-proof-text { font-size: 13px; color: var(--su-text-sec); line-height: 1.4; }
        .su-proof-text strong { color: #fff; font-weight: 700; }

        .su-footer { position: relative; z-index: 2; font-size: 12px; color: var(--su-text-muted); }

        .su-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 40px 24px; overflow-y: auto;
          background: var(--su-surface);
          border-left: 1px solid var(--su-border);
        }
        .su-form-wrap { width: 100%; max-width: 400px; }

        .su-mobile-logo {
          display: flex; align-items: center; gap: 10px; margin-bottom: 32px;
          font-family: var(--font-display, 'Outfit', system-ui, sans-serif);
          font-weight: 900; font-size: 22px; letter-spacing: -0.04em; color: #fff;
        }
        @media (min-width: 900px) { .su-mobile-logo { display: none; } }

        .su-form-title {
          font-family: var(--font-display, 'Outfit', system-ui, sans-serif);
          font-size: 26px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 6px;
        }
        .su-form-sub { font-size: 14px; color: var(--su-text-sec); margin-bottom: 28px; }

        .su-coupon {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 10px; margin-bottom: 20px;
          background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25);
        }
        .su-coupon-title { font-size: 13px; font-weight: 600; color: #10B981; }
        .su-coupon-sub { font-size: 12px; color: var(--su-text-sec); margin-top: 2px; }

        .su-google-btn {
          width: 100%; display: flex; align-items: center; justify-content: center;
          gap: 10px; padding: 13px 16px; border-radius: 12px;
          border: 1px solid var(--su-border-strong); background: var(--su-elevated);
          color: var(--su-text); font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.2s var(--su-ease);
          font-family: inherit;
        }
        .su-google-btn:hover {
          background: var(--su-hover); border-color: rgba(255,255,255,0.18);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        .su-divider { display: flex; align-items: center; gap: 14px; margin: 22px 0; }
        .su-divider-line { flex: 1; height: 1px; background: var(--su-border); }
        .su-divider-text { font-size: 12px; color: var(--su-text-muted); white-space: nowrap; }

        .su-field { position: relative; }
        .su-field-icon {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          color: var(--su-text-muted); pointer-events: none;
          transition: color 0.2s;
        }
        .su-input {
          width: 100%; padding: 14px 16px 14px 46px;
          border-radius: 12px; border: 1px solid var(--su-border);
          background: var(--su-bg); color: var(--su-text);
          font-size: 14px; font-family: inherit;
          transition: all 0.2s var(--su-ease); outline: none;
          box-sizing: border-box;
        }
        .su-input::placeholder { color: var(--su-text-muted); }
        .su-input:focus {
          border-color: var(--su-primary);
          box-shadow: 0 0 0 3px rgba(255,0,102,0.10);
        }
        .su-field:focus-within .su-field-icon { color: var(--su-primary); }

        .su-error {
          padding: 10px 14px; border-radius: 8px;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
          color: #EF4444; font-size: 13px;
        }

        .su-submit {
          width: 100%; padding: 14px 16px; border-radius: 12px; border: none;
          background: var(--su-primary); color: #fff;
          font-size: 15px; font-weight: 700;
          font-family: var(--font-display, 'Outfit', system-ui, sans-serif);
          letter-spacing: -0.01em;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 20px rgba(255,0,102,0.25), inset 0 1px 0 rgba(255,255,255,0.12);
          transition: all 0.2s var(--su-ease); margin-top: 6px;
        }
        .su-submit:hover:not(:disabled) {
          background: var(--su-primary-hover);
          box-shadow: 0 8px 32px rgba(255,0,102,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
          transform: translateY(-1px);
        }
        .su-submit:active:not(:disabled) { transform: scale(0.98); }
        .su-submit:disabled { cursor: wait; opacity: 0.7; }

        .su-link { color: var(--su-primary); font-weight: 600; transition: color 0.15s; }
        .su-link:hover { color: #FF3385; }

        .su-bottom-text {
          text-align: center; margin-top: 20px; font-size: 13px; color: var(--su-text-muted);
        }
        .su-legal {
          text-align: center; margin-top: 16px; font-size: 11px; color: var(--su-text-muted);
          line-height: 1.6;
        }
        .su-legal a { color: var(--su-text-sec); text-decoration: underline; text-underline-offset: 2px; }
        .su-legal a:hover { color: #fff; }

        .su-preview-card {
          position: absolute; bottom: 100px; right: 48px; z-index: 3;
          width: 280px; padding: 20px;
          background: rgba(19,19,26,0.85); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,0,102,0.20); border-radius: 18px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
          animation: su-float-card 5s ease-in-out infinite;
        }
        @keyframes su-float-card {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(0.5deg); }
        }
        .preview-header {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;
        }
        .preview-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--su-primary);
          font-family: var(--font-display, 'Outfit', system-ui, sans-serif);
        }
        .preview-live {
          display: flex; align-items: center; gap: 5px;
          font-size: 10px; color: var(--su-secondary); font-weight: 700;
          padding: 2px 8px; border-radius: 20px;
          background: rgba(0,212,170,0.08); border: 1px solid rgba(0,212,170,0.15);
        }
        .preview-live-dot {
          width: 5px; height: 5px; border-radius: 50%; background: var(--su-secondary);
          animation: su-pulse-dot 2s ease-in-out infinite;
        }
        .preview-kpi { display: flex; gap: 10px; margin-bottom: 14px; }
        .preview-kpi-item { flex: 1; }
        .preview-kpi-val {
          font-family: var(--font-display, 'Outfit', system-ui, sans-serif);
          font-size: 18px; font-weight: 900; color: #fff; letter-spacing: -0.02em;
        }
        .preview-kpi-label { font-size: 10px; color: var(--su-text-muted); margin-top: 2px; }
        .preview-kpi-change {
          font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px;
          margin-left: 4px;
        }
        .preview-bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 40px; }
        .preview-bar {
          flex: 1; border-radius: 3px 3px 0 0; min-width: 0;
          animation: su-bar-grow 1.2s var(--su-ease) forwards;
          transform-origin: bottom;
        }
        @keyframes su-bar-grow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }

        .su-preview-card-2 {
          position: absolute; top: 160px; right: 32px; z-index: 3;
          width: 220px; padding: 16px;
          background: rgba(19,19,26,0.80); backdrop-filter: blur(16px);
          border: 1px solid rgba(0,212,170,0.18); border-radius: 14px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.4);
          animation: su-float-card 6s ease-in-out infinite 1.5s;
        }
        .preview2-row { display: flex; align-items: center; gap: 10px; }
        .preview2-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(0,212,170,0.12); border: 1px solid rgba(0,212,170,0.18);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .preview2-text { font-size: 12px; color: var(--su-text-sec); font-weight: 600; line-height: 1.4; }
        .preview2-text strong { color: #fff; }

        @media (max-width: 899px) {
          .su-right { border-left: none; background: var(--su-bg); }
          .su-preview-card, .su-preview-card-2 { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .su-layout *, .su-layout *::before, .su-layout *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0A0A0F' }} />}>
      <SignUpInner />
    </Suspense>
  );
}
