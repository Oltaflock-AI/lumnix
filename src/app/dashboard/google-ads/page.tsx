'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, Target, MousePointerClick, RefreshCw, AlertCircle, BarChart3, Zap } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { useIntegrations, useGoogleAdsData } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

function StatCard({ icon: Icon, color, label, value, sub }: { icon: any; color: string; label: string; value: string; sub?: string }) {
  const { c } = useTheme();
  return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: 12, color: c.textSecondary }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: c.text, fontFamily: 'var(--font-mono)', marginBottom: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: c.textMuted }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    ENABLED: { color: '#10B981', bg: 'rgba(16,185,129,0.08)', label: 'Active' },
    PAUSED: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', label: 'Paused' },
    REMOVED: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', label: 'Removed' },
  };
  const { c } = useTheme();
  const s = map[status] || { color: c.textMuted, bg: 'rgba(85,85,85,0.1)', label: status };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: s.color, backgroundColor: s.bg, padding: '2px 8px', borderRadius: 4 }}>
      {s.label}
    </span>
  );
}

export default function GoogleAdsPage() {
  const { c } = useTheme();
  const router = useRouter();
  const { workspace, loading: wsLoading } = useWorkspaceCtx();
  const { integrations, loading: intLoading } = useIntegrations(workspace?.id);
  const { data: adsData, loading: dataLoading, refetch } = useGoogleAdsData(workspace?.id);

  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const integration = integrations.find(i => i.provider === 'google_ads');
  const loading = wsLoading || intLoading;

  const campaigns = adsData?.campaigns || [];
  const totals = adsData?.totals;
  const hasData = campaigns.length > 0;

  async function handleSync() {
    if (!integration || !workspace) return;
    setSyncing(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sync/google-ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ integration_id: integration.id, workspace_id: workspace.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sync failed');
      refetch();
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    }
    setSyncing(false);
  }

  const totalSpend = totals?.spend || 0;
  const totalClicks = totals?.clicks || 0;
  const totalImpressions = totals?.impressions || 0;
  const totalConversions = totals?.conversions || 0;
  const totalConvValue = totals?.conversions_value || 0;
  const avgCPC = totals?.avg_cpc || 0;
  const roas = totals?.roas || 0;

  return (
    <PageShell title="Google Ads" description="Campaign performance & spend tracking" icon={DollarSign}>

      {loading || dataLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, height: 90, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : !integration ? (
        <EmptyState
          icon={DollarSign}
          title="Connect Google Ads"
          description="Link your Google Ads account to track campaign performance, spend, ROAS, and get AI-powered optimization recommendations."
          actionLabel="Connect in Settings"
          onAction={() => router.push('/dashboard/settings')}
        />
      ) : (
        <>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: c.textMuted }}>
              {integration.last_sync_at ? (
                <>
                  Last synced {new Date(integration.last_sync_at).toLocaleString()}
                  {Date.now() - new Date(integration.last_sync_at).getTime() > 24 * 60 * 60 * 1000 && (
                    <span style={{ fontSize: 11, color: c.warning, fontWeight: 600 }}>Stale</span>
                  )}
                </>
              ) : 'Never synced'}
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                borderRadius: 8, border: `1px solid ${c.borderStrong}`, backgroundColor: c.bgCard,
                color: c.textSecondary, fontSize: 13, cursor: syncing ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={e => { if (!syncing) (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCardHover; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCard; }}
            >
              <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 10, backgroundColor: c.dangerSubtle, border: `1px solid ${c.dangerBorder}`, marginBottom: 20 }}>
              <AlertCircle size={16} color={c.danger} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.danger, marginBottom: 2 }}>Sync Failed</div>
                <div style={{ fontSize: 12, color: c.textSecondary }}>{error}</div>
                {error.toLowerCase().includes('developer') && (
                  <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>
                    Add GOOGLE_ADS_DEVELOPER_TOKEN to your environment variables to enable the Google Ads API.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No data yet */}
          {!hasData && !error && (
            <div style={{ backgroundColor: c.bgCard, border: `1px dashed ${c.border}`, borderRadius: 14, padding: '48px 24px', textAlign: 'center', marginBottom: 20 }}>
              <BarChart3 size={32} color={c.borderStrong} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>No campaign data yet</div>
              <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Click "Sync Now" to pull your Google Ads campaigns.</div>
            </div>
          )}

          {/* Stats cards */}
          {hasData && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                <StatCard icon={DollarSign} color="#F59E0B" label="Total Spend" value={`$${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="Last 30 days" />
                <StatCard icon={MousePointerClick} color={c.accent} label="Total Clicks" value={totalClicks.toLocaleString()} sub={`${totalImpressions.toLocaleString()} impressions`} />
                <StatCard icon={Target} color="#10B981" label="Conversions" value={totalConversions.toLocaleString()} sub={`$${totalConvValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} value`} />
                <StatCard icon={TrendingUp} color={c.accent} label="ROAS" value={`${roas.toFixed(2)}x`} sub={roas >= 3 ? 'Healthy' : roas >= 1 ? 'Breakeven' : 'Losing money'} />
                <StatCard icon={Zap} color="#EF4444" label="Avg CPC" value={`$${avgCPC.toFixed(2)}`} sub="Per click average" />
                <StatCard icon={BarChart3} color={c.textSecondary} label="Campaigns" value={campaigns.length.toString()} sub={`${campaigns.filter((c: any) => c.status === 'ENABLED').length} active`} />
              </div>

              {/* Campaign table */}
              <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 14, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 16 }}>Campaigns</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                    <thead>
                      <tr>
                        {['Campaign', 'Status', 'Spend', 'Clicks', 'Impressions', 'Conversions', 'CPC', 'ROAS'].map(h => (
                          <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 10, borderBottom: `1px solid ${c.border}`, paddingRight: 12, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((camp: any, i: number) => {
                        const cRoas = camp.roas > 0 ? camp.roas.toFixed(2) : '—';
                        const cCpc = camp.avg_cpc > 0 ? camp.avg_cpc.toFixed(2) : '—';
                        return (
                          <tr
                            key={camp.campaign_id || i}
                            style={{ borderBottom: `1px solid ${c.border}` }}
                            onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = c.bgCardHover}
                            onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
                          >
                            <td style={{ padding: '12px 12px 12px 0', fontSize: 13, color: c.text, fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{camp.campaign_name}</td>
                            <td style={{ padding: '12px 12px 12px 0' }}><StatusBadge status={camp.status} /></td>
                            <td style={{ padding: '12px 12px 12px 0', fontSize: 13, color: c.text, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>${(camp.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style={{ padding: '12px 12px 12px 0', fontSize: 13, color: c.textSecondary, fontFamily: 'var(--font-mono)' }}>{(camp.clicks || 0).toLocaleString()}</td>
                            <td style={{ padding: '12px 12px 12px 0', fontSize: 13, color: c.textSecondary, fontFamily: 'var(--font-mono)' }}>{(camp.impressions || 0).toLocaleString()}</td>
                            <td style={{ padding: '12px 12px 12px 0', fontSize: 13, color: c.textSecondary, fontFamily: 'var(--font-mono)' }}>{(camp.conversions || 0).toFixed(1)}</td>
                            <td style={{ padding: '12px 12px 12px 0', fontSize: 13, color: c.textSecondary, fontFamily: 'var(--font-mono)' }}>{cCpc !== '—' ? `$${cCpc}` : '—'}</td>
                            <td style={{ padding: '12px 0', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: parseFloat(cRoas as string) >= 3 ? '#10B981' : parseFloat(cRoas as string) >= 1 ? '#F59E0B' : '#EF4444' }}>
                              {cRoas !== '—' ? `${cRoas}x` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </PageShell>
  );
}
