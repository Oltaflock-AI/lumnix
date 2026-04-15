'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { useIntegrations, connectIntegration, syncIntegration } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';
import { apiFetch } from '@/lib/api-fetch';

/* ─── Provider Config ─── */
interface ProviderItem {
  id: string;
  name: string;
  description: string;
  required: boolean;
  icon: React.ReactNode;
}

const GSC_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#4285F4" />
    <path d="M7 12L10.5 15.5L17 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GA4_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#E37400" />
    <path d="M8 16V11M12 16V8M16 16V13" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const GADS_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#34A853" />
    <path d="M12 7V17M7 12H17" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const META_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#0081FB" />
    <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" />
  </svg>
);

const PROVIDERS: ProviderItem[] = [
  {
    id: 'gsc',
    name: 'Google Search Console',
    description: 'Track organic search rankings, impressions, and clicks',
    required: true,
    icon: GSC_ICON,
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    description: 'Monitor website traffic, user behavior, and conversions',
    required: true,
    icon: GA4_ICON,
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    description: 'Track ad spend, ROAS, and campaign performance',
    required: false,
    icon: GADS_ICON,
  },
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    description: 'Monitor Facebook and Instagram ad campaigns',
    required: false,
    icon: META_ICON,
  },
];

/* ─── Main Onboarding Page ─── */
export default function OnboardingPage() {
  const router = useRouter();
  const { c } = useTheme();
  const { workspace, loading: wsLoading } = useWorkspaceCtx();
  const { integrations, loading: intLoading, refetch } = useIntegrations(workspace?.id);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);

  // After OAuth redirect, detect ?connected param and auto-sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedProvider = params.get('connected');
    if (connectedProvider) {
      refetch();
      // Auto-sync after connection
      const timer = setTimeout(async () => {
        const fresh = await fetchIntegrations(workspace?.id);
        const int = fresh?.find((i: any) => i.provider === connectedProvider && i.status === 'connected');
        if (int && workspace?.id) {
          setSyncingProvider(connectedProvider);
          try {
            await syncIntegration(int.id, workspace.id, connectedProvider);
          } catch {}
          setSyncingProvider(null);
          refetch();
        }
      }, 1000);
      window.history.replaceState({}, '', '/dashboard/onboarding');
      return () => clearTimeout(timer);
    }
  }, [workspace?.id]);

  async function fetchIntegrations(workspaceId: string | undefined) {
    if (!workspaceId) return null;
    try {
      const res = await apiFetch(`/api/integrations/list?workspace_id=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        return data.integrations || [];
      }
    } catch {}
    return null;
  }

  function isConnected(providerId: string) {
    return integrations.some(
      (i: any) => i.provider === providerId && i.status === 'connected'
    );
  }

  const connectedCount = PROVIDERS.filter(p => isConnected(p.id)).length;
  const hasAtLeastOne = connectedCount > 0;

  async function handleConnect(providerId: string) {
    if (!workspace?.id) return;
    setConnectingProvider(providerId);
    await connectIntegration(providerId, workspace.id);
    // connectIntegration redirects via window.location.href, so this line
    // only runs if the redirect didn't happen (error case)
    setConnectingProvider(null);
  }

  const loading = wsLoading || intLoading;

  /* ─── Styles ─── */
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    padding: '40px 36px',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.5px',
    fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
    margin: 0,
    textAlign: 'center' as const,
  };

  const subheadingStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#64748B',
    fontFamily: "'DM Sans', sans-serif",
    textAlign: 'center' as const,
    marginTop: 8,
    marginBottom: 0,
    lineHeight: 1.5,
  };

  const progressBarBg: React.CSSProperties = {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginTop: 28,
    marginBottom: 32,
    overflow: 'hidden',
  };

  const progressBarFill: React.CSSProperties = {
    height: '100%',
    width: `${(connectedCount / PROVIDERS.length) * 100}%`,
    backgroundColor: '#7C3AED',
    borderRadius: 3,
    transition: 'width 400ms ease',
  };

  const progressLabel: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748B',
    fontFamily: "'DM Sans', sans-serif",
    textAlign: 'center' as const,
    marginTop: 20,
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <img
            src="/favicon.png"
            alt="Lumnix"
            style={{ width: 36, height: 36, borderRadius: 8, opacity: 0.6 }}
            className="animate-pulse"
          />
          <span style={{ fontSize: 13, color: '#94A3B8', fontFamily: "'DM Sans', sans-serif" }}>
            Loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <img
            src="/favicon.png"
            alt="Lumnix"
            style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain' }}
          />
        </div>

        {/* Heading */}
        <h1 style={headingStyle}>Connect your data sources</h1>
        <p style={subheadingStyle}>
          Link your marketing platforms to unlock insights.
          <br />
          You can always add more later in Settings.
        </p>

        {/* Progress */}
        <p style={progressLabel}>
          {connectedCount} of {PROVIDERS.length} connected
        </p>
        <div style={progressBarBg}>
          <div style={progressBarFill} />
        </div>

        {/* Provider Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PROVIDERS.map(provider => {
            const connected = isConnected(provider.id);
            const isConnecting = connectingProvider === provider.id;
            const isSyncing = syncingProvider === provider.id;

            return (
              <div
                key={provider.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 18px',
                  borderRadius: 12,
                  border: `1px solid ${connected ? 'rgba(34,197,94,0.3)' : '#E2E8F0'}`,
                  backgroundColor: connected ? 'rgba(34,197,94,0.04)' : '#FAFBFC',
                  transition: 'border-color 200ms, background-color 200ms',
                }}
              >
                {/* Icon */}
                <div style={{ flexShrink: 0 }}>{provider.icon}</div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#0F172A',
                        fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
                      }}
                    >
                      {provider.name}
                    </span>
                    {!provider.required && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#94A3B8',
                          backgroundColor: '#F1F5F9',
                          padding: '2px 8px',
                          borderRadius: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Optional
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: '#64748B',
                      fontFamily: "'DM Sans', sans-serif",
                      margin: '4px 0 0',
                      lineHeight: 1.4,
                    }}
                  >
                    {provider.description}
                  </p>
                </div>

                {/* Action */}
                <div style={{ flexShrink: 0 }}>
                  {connected ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#166534',
                        backgroundColor: '#DCFCE7',
                        padding: '6px 14px',
                        borderRadius: 8,
                      }}
                    >
                      <Check size={14} strokeWidth={2.5} />
                      Connected
                    </span>
                  ) : isSyncing ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#7C3AED',
                        padding: '6px 14px',
                      }}
                    >
                      <Loader2 size={14} className="animate-spin" />
                      Syncing...
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(provider.id)}
                      disabled={isConnecting}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#FFFFFF',
                        backgroundColor: '#7C3AED',
                        border: 'none',
                        borderRadius: 8,
                        padding: '7px 16px',
                        cursor: isConnecting ? 'not-allowed' : 'pointer',
                        opacity: isConnecting ? 0.7 : 1,
                        fontFamily: "'DM Sans', sans-serif",
                        transition: 'background-color 150ms, transform 100ms',
                      }}
                      onMouseEnter={e => {
                        if (!isConnecting) e.currentTarget.style.backgroundColor = '#6D28D9';
                      }}
                      onMouseLeave={e => {
                        if (!isConnecting) e.currentTarget.style.backgroundColor = '#7C3AED';
                      }}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <ExternalLink size={13} />
                          Connect
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            marginTop: 32,
          }}
        >
          <button
            onClick={() => router.push('/dashboard')}
            disabled={!hasAtLeastOne}
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 700,
              color: '#FFFFFF',
              backgroundColor: hasAtLeastOne ? '#7C3AED' : '#CBD5E1',
              border: 'none',
              borderRadius: 10,
              padding: '12px 24px',
              cursor: hasAtLeastOne ? 'pointer' : 'not-allowed',
              fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
              transition: 'background-color 150ms, transform 100ms',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => {
              if (hasAtLeastOne) e.currentTarget.style.backgroundColor = '#6D28D9';
            }}
            onMouseLeave={e => {
              if (hasAtLeastOne) e.currentTarget.style.backgroundColor = '#7C3AED';
            }}
          >
            Go to Dashboard
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              padding: '4px 8px',
              transition: 'color 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#64748B')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
