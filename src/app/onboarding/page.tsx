'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, Check, Search, BarChart3, Target, Share2, ChevronRight, Loader2, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ThemeProvider, useTheme } from '@/lib/theme';

const BRAND_COLORS = [
  { label: 'Indigo', value: '#6366F1' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Orange', value: '#f59e0b' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Red', value: '#ef4444' },
];

const INTEGRATIONS = [
  { id: 'gsc', name: 'Google Search Console', icon: Search, color: '#4285F4', desc: 'Track keyword rankings & clicks' },
  { id: 'ga4', name: 'Google Analytics 4', icon: BarChart3, color: '#E37400', desc: 'Website traffic & conversions' },
  { id: 'google_ads', name: 'Google Ads', icon: Target, color: '#34A853', desc: 'Campaign performance & ROAS' },
  { id: 'meta_ads', name: 'Meta Ads', icon: Share2, color: '#1877F2', desc: 'Facebook & Instagram ads' },
];

function OnboardingInner() {
  const { c } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [brandName, setBrandName] = useState('');
  const [brandColor, setBrandColor] = useState('#6366F1');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [syncingProviders, setSyncingProviders] = useState<Set<string>>(new Set());
  const [syncResults, setSyncResults] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [couponResult, setCouponResult] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Get coupon from URL or localStorage (OAuth flow)
  const couponCode = searchParams.get('coupon') || (typeof window !== 'undefined' ? localStorage.getItem('lumnix-coupon') : null) || '';

  // Detect if returning from OAuth — auto-advance to step 2 and trigger sync
  const justConnected = searchParams.get('connected');
  useEffect(() => {
    if (!justConnected) return;
    setStep(2);
    // Fetch integrations to show connected status
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const wRes = await fetch('/api/workspace', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const { workspace } = await wRes.json();
      if (!workspace?.id) return;

      const iRes = await fetch(`/api/integrations/list?workspace_id=${workspace.id}`);
      const { integrations } = await iRes.json();
      const connected = (integrations || []).filter((i: any) => i.status === 'connected');
      setConnectedProviders(connected.map((i: any) => i.provider));

      // Auto-sync the just-connected provider
      const justInt = connected.find((i: any) => i.provider === justConnected);
      if (justInt) {
        triggerSync(justInt.id, workspace.id, justConnected);
      }
    })();
  }, [justConnected]);

  // Also load connected integrations on step 2 mount
  useEffect(() => {
    if (step !== 2) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const wRes = await fetch('/api/workspace', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const { workspace } = await wRes.json();
      if (!workspace?.id) return;
      const iRes = await fetch(`/api/integrations/list?workspace_id=${workspace.id}`);
      const { integrations } = await iRes.json();
      const connected = (integrations || []).filter((i: any) => i.status === 'connected');
      setConnectedProviders(connected.map((i: any) => i.provider));
    })();
  }, [step]);

  async function triggerSync(integrationId: string, workspaceId: string, provider: string) {
    const endpointMap: Record<string, string> = {
      gsc: '/api/sync/gsc', ga4: '/api/sync/ga4',
      google_ads: '/api/sync/google-ads', meta_ads: '/api/sync/meta-ads',
    };
    const endpoint = endpointMap[provider];
    if (!endpoint) return;

    setSyncingProviders(prev => new Set(prev).add(provider));
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integration_id: integrationId, workspace_id: workspaceId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncResults(prev => ({ ...prev, [provider]: { ok: true, msg: 'Data synced successfully' } }));
      } else {
        setSyncResults(prev => ({ ...prev, [provider]: { ok: false, msg: data.error || 'Sync failed' } }));
      }
    } catch {
      setSyncResults(prev => ({ ...prev, [provider]: { ok: false, msg: 'Sync failed' } }));
    }
    setSyncingProviders(prev => { const n = new Set(prev); n.delete(provider); return n; });
  }

  async function redeemCoupon(workspaceId: string, token: string) {
    if (!couponCode) return;
    try {
      const res = await fetch('/api/billing/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode, workspace_id: workspaceId }),
      });
      const data = await res.json();
      if (data.success) {
        setCouponResult({ ok: true, text: data.message });
        localStorage.removeItem('lumnix-coupon');
      } else {
        setCouponResult({ ok: false, text: data.error || 'Coupon redemption failed' });
      }
    } catch {
      setCouponResult({ ok: false, text: 'Failed to redeem coupon' });
    }
  }

  async function handleLogoUpload(file: File) {
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const ext = file.name.split('.').pop();
      const path = `${session.user.id}/logo.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('brand-assets')
        .upload(path, file, { upsert: true });
      if (!upErr) {
        const { data } = supabase.storage.from('brand-assets').getPublicUrl(path);
        setLogoUrl(data.publicUrl);
        setLogoPreview(URL.createObjectURL(file));
      }
    } catch {}
    setUploading(false);
  }

  async function handleStep1Submit() {
    if (!brandName.trim()) { setError('Please enter a brand name'); return; }
    setSaving(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/signin'); return; }
      const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const patchRes = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: brandName, brand_color: brandColor, logo_url: logoUrl, slug }),
      });

      // Auto-redeem coupon if present
      if (couponCode) {
        const wsRes = await fetch('/api/workspace', { headers: { Authorization: `Bearer ${session.access_token}` } });
        const { workspace } = await wsRes.json();
        if (workspace?.id) {
          await redeemCoupon(workspace.id, session.access_token);
        }
      }

      setStep(2);
    } catch {
      setError('Failed to save. Please try again.');
    }
    setSaving(false);
  }

  async function handleConnect(providerId: string) {
    setConnecting(providerId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const wRes = await fetch('/api/workspace', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const { workspace } = await wRes.json();
      if (!workspace?.id) return;
      const res = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId, workspace_id: workspace.id, return_to: '/onboarding' }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch {}
    setConnecting(null);
  }

  const stepStyle = (n: number) => ({
    width: '32px', height: '32px', borderRadius: '50%',
    display: 'flex', alignItems: 'center' as const, justifyContent: 'center',
    fontSize: '14px', fontWeight: 700,
    fontFamily: 'var(--font-display)',
    backgroundColor: step > n ? c.success : step === n ? c.accent : c.bgCard,
    color: step >= n ? 'white' : c.textSecondary,
    border: step > n ? 'none' : step === n ? 'none' : `1px solid ${c.border}`,
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: c.bgPage, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1.5px', fontFamily: 'var(--font-display)' }}>
          <span style={{ color: c.accent }}>L</span><span style={{ color: c.text }}>umnix</span>
        </span>
      </div>

      {/* Steps indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
        {[1, 2, 3].map((n, i) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={stepStyle(n)}>
              {step > n ? <Check size={16} /> : n}
            </div>
            {i < 2 && <div style={{ width: '48px', height: '2px', backgroundColor: step > n ? c.success : c.borderStrong }} />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '520px', backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: '36px' }}>

        {/* Step 1: Brand Setup */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: c.text, marginBottom: '6px', fontFamily: 'var(--font-display)' }}>Set up your brand</h1>
            <p style={{ fontSize: '14px', color: c.textSecondary, marginBottom: '28px' }}>This personalizes your Lumnix dashboard</p>

            {/* Brand Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.textSecondary, marginBottom: '8px' }}>Brand Name</label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, backgroundColor: c.bgCard, color: c.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)', transition: 'border-color 0.15s' }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = c.accent}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = c.border}
              />
            </div>

            {/* Logo Upload */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.textSecondary, marginBottom: '8px' }}>Logo (optional)</label>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '8px', border: `2px dashed ${c.borderStrong}`, cursor: 'pointer', backgroundColor: c.bgPage }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: c.bgCard, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {uploading ? <Loader2 size={20} color={c.textSecondary} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={20} color={c.textSecondary} />}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '14px', color: c.textSecondary, fontWeight: 500 }}>{uploading ? 'Uploading...' : logoPreview ? 'Logo uploaded' : 'Click to upload logo'}</div>
                  <div style={{ fontSize: '12px', color: c.textMuted, marginTop: '2px' }}>PNG, JPG up to 2MB</div>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}
              />
            </div>

            {/* Brand Color */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.textSecondary, marginBottom: '10px' }}>Brand Color</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {BRAND_COLORS.map(bc => (
                  <button
                    key={bc.value}
                    onClick={() => setBrandColor(bc.value)}
                    title={bc.label}
                    style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      backgroundColor: bc.value, border: 'none', cursor: 'pointer',
                      outline: brandColor === bc.value ? `3px solid white` : '3px solid transparent',
                      outlineOffset: '2px', position: 'relative',
                    }}
                  >
                    {brandColor === bc.value && (
                      <Check size={16} color="white" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', backgroundColor: c.dangerSubtle, border: `1px solid ${c.dangerBorder}`, color: c.danger, fontSize: '13px' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleStep1Submit}
              disabled={saving}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: c.accent, color: 'white', fontSize: '14px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'var(--font-body)', transition: 'background-color 0.15s' }}
              onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.accentHover; }}
              onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.accent; }}
            >
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {saving ? 'Saving...' : 'Continue'}
              {!saving && <ChevronRight size={16} />}
            </button>
          </div>
        )}

        {/* Step 2: Connect Integrations */}
        {step === 2 && (
          <div>
            {couponResult && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
                backgroundColor: couponResult.ok ? c.successSubtle : c.dangerSubtle,
                border: `1px solid ${couponResult.ok ? c.successBorder : c.dangerBorder}`,
              }}>
                {couponResult.ok ? <Gift size={16} color={c.success} /> : null}
                <span style={{ fontSize: '13px', fontWeight: 600, color: couponResult.ok ? c.success : c.danger }}>{couponResult.text}</span>
              </div>
            )}
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: c.text, marginBottom: '6px', fontFamily: 'var(--font-display)' }}>Connect your data</h1>
            <p style={{ fontSize: '14px', color: c.textSecondary, marginBottom: '28px' }}>Connect your marketing accounts to start seeing real data. You can always do this later in Settings.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {INTEGRATIONS.map(int => {
                const Icon = int.icon;
                const isConnected = connectedProviders.includes(int.id);
                const isSyncing = syncingProviders.has(int.id);
                const syncResult = syncResults[int.id];
                return (
                  <div key={int.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: 12, border: `1px solid ${isConnected ? c.successBorder : c.border}`, backgroundColor: isConnected ? c.successSubtle : c.bgPage }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${int.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} color={int.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: c.text }}>{int.name}</div>
                      <div style={{ fontSize: '12px', color: c.textSecondary, marginTop: '2px' }}>
                        {isSyncing ? 'Syncing your data...' : syncResult ? syncResult.msg : isConnected ? 'Connected' : int.desc}
                      </div>
                    </div>
                    {isConnected ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', backgroundColor: c.success, color: 'white', fontSize: '13px', fontWeight: 600 }}>
                        {isSyncing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                        {isSyncing ? 'Syncing' : 'Connected'}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnect(int.id)}
                        disabled={connecting === int.id}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: c.accent, color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, fontFamily: 'var(--font-body)', transition: 'background-color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.accentHover}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.accent}
                      >
                        {connecting === int.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setStep(3)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${c.border}`, backgroundColor: 'transparent', color: c.textSecondary, fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCardHover}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'}
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: c.successSubtle, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Check size={36} color={c.success} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: c.text, marginBottom: '8px', fontFamily: 'var(--font-display)' }}>You&apos;re all set!</h1>
            <p style={{ fontSize: '14px', color: c.textSecondary, marginBottom: '20px', lineHeight: 1.6 }}>
              {connectedProviders.length > 0
                ? `${connectedProviders.length} data source${connectedProviders.length > 1 ? 's' : ''} connected and syncing. Your dashboard is ready.`
                : 'Your workspace is ready. Connect data sources anytime in Settings.'}
            </p>
            {connectedProviders.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {connectedProviders.map(p => (
                  <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '100px', backgroundColor: c.successSubtle, border: `1px solid ${c.successBorder}`, fontSize: '12px', fontWeight: 600, color: c.success }}>
                    <Check size={12} /> {INTEGRATIONS.find(i => i.id === p)?.name || p}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => router.push('/dashboard')}
              style={{ width: '100%', padding: '13px', borderRadius: '8px', border: 'none', backgroundColor: c.accent, color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'var(--font-body)', transition: 'background-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.accentHover}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.accent}
            >
              Go to Dashboard <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {step < 3 && (
        <p style={{ marginTop: '20px', fontSize: '13px', color: c.textSecondary }}>
          Step {step} of 3
        </p>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <ThemeProvider>
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <OnboardingInner />
      </Suspense>
    </ThemeProvider>
  );
}
