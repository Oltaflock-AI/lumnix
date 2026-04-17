'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, RefreshCw, AlertCircle, MousePointerClick, TrendingUp } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useIntegrations, useGoogleAdsData } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatNumber, formatINR, formatROAS } from '@/lib/format';
import { Sparkline } from '@/components/Sparkline';

function StatCard({ icon: Icon, color, label, value, sub }: { icon: any; color: string; label: string; value: string; sub?: string }) {
  const { c } = useTheme();
  return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: 12, color: c.textSecondary }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: c.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', marginBottom: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: c.textMuted }}>{sub}</div>}
    </div>
  );
}

/* Inline Google Ads brand logo (colored) */
function GoogleAdsLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 192 192" fill="none" aria-hidden="true">
      <path d="M8.6 129.4l52.9-91.6c6.3-10.9 20.3-14.6 31.2-8.3s14.6 20.3 8.3 31.2L48 152.3c-6.3 10.9-20.3 14.6-31.2 8.3-10.9-6.3-14.6-20.3-8.2-31.2z" fill="#FBBC04" />
      <path d="M183.4 129.4l-52.9-91.6c-6.3-10.9-20.3-14.6-31.2-8.3-10.9 6.3-14.6 20.3-8.3 31.2l52.9 91.6c6.3 10.9 20.3 14.6 31.2 8.3 10.9-6.3 14.6-20.3 8.3-31.2z" fill="#4285F4" />
      <circle cx="38.7" cy="152.5" r="31.7" fill="#34A853" />
    </svg>
  );
}

export default function GoogleAdsPage() {
  const { c, theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const { workspace, loading: wsLoading } = useWorkspaceCtx();
  const { integrations, loading: intLoading } = useIntegrations(workspace?.id);
  const [days, setDays] = useState(30);
  const { data: adsData, loading: dataLoading, refetch } = useGoogleAdsData(workspace?.id, days);

  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const integration = integrations.find(i => i.provider === 'google_ads');
  const connected = !!integration;
  const loading = wsLoading || intLoading;

  const campaigns = adsData?.campaigns || [];
  const totals = adsData?.totals;
  const daily: any[] = adsData?.daily || [];
  const hasData = campaigns.length > 0;

  const dailySpend = daily.map((d: any) => d.spend || 0);
  const dailyClicksArr = daily.map((d: any) => d.clicks || 0);
  const dailyCPC = daily.map((d: any) => (d.clicks > 0 ? (d.spend || 0) / d.clicks : 0));
  const dailyConversions = daily.map((d: any) => d.conversions || 0);
  // ROAS daily not exposed by API — fall back to spend trend as requested
  const dailyROAS = dailySpend;

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

  // Ad group mix for donut (from campaign types)
  const enabledCampaigns = campaigns.filter((camp: any) => camp.status === 'ENABLED').length;

  return (
    <PageShell title="Google" titleAccent="Ads" description="Campaign performance & spend tracking">
      {loading || dataLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
          ))}
        </div>
      ) : !connected ? (
        <div className="lx-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(66,133,244,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <GoogleAdsLogo size={28} />
          </div>
          <div className="lx-card-title" style={{ fontSize: 18, marginBottom: 8 }}>Connect Google Ads</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, maxWidth: 420, margin: '0 auto 20px' }}>
            Link your Google Ads account to track campaign performance, spend, ROAS, and get AI-powered optimization recommendations.
          </div>
          <Button onClick={() => router.push('/dashboard/settings')}>
            Connect in Settings
          </Button>
        </div>
      ) : (
        <>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <DateRangePicker value={days} onChange={setDays} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {integration?.last_sync_at ? (
                  <>
                    Last synced {new Date(integration.last_sync_at).toLocaleString()}
                    {Date.now() - new Date(integration.last_sync_at).getTime() > 24 * 60 * 60 * 1000 && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>Stale</span>
                    )}
                  </>
                ) : 'Never synced'}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
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
            <div className="lx-card" style={{ padding: '48px 24px', textAlign: 'center', borderStyle: 'dashed' }}>
              <GoogleAdsLogo size={32} />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-sec)', margin: '12px 0 6px' }}>No campaign data yet</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Click &quot;Sync Now&quot; to pull your Google Ads campaigns.</div>
            </div>
          )}

          {/* KPI Grid — mono mockup style */}
          {hasData && (
            <>
              <div className="lx-kpi-grid">
                {/* Spend */}
                <div className="lx-kpi-card">
                  <div className="lx-kpi-top">
                    <span className="lx-kpi-label">Spend</span>
                    <div className="lx-icon-pill lx-icon-pill--ads">
                      <GoogleAdsLogo />
                    </div>
                  </div>
                  <div className="lx-kpi-value">{totalSpend > 0 ? formatINR(totalSpend, 0) : '—'}</div>
                  <Sparkline data={dailySpend} color="#EF4444" className="lx-sparkline" ariaLabel="Daily spend trend" />
                  <div className="lx-kpi-footer">
                    <span className="lx-kpi-compare">Last {days} days</span>
                  </div>
                </div>

                {/* Clicks */}
                <div className="lx-kpi-card">
                  <div className="lx-kpi-top">
                    <span className="lx-kpi-label">Clicks</span>
                    <div className="lx-icon-pill lx-icon-pill--ads">
                      <GoogleAdsLogo />
                    </div>
                  </div>
                  <div className="lx-kpi-value">{totalClicks > 0 ? formatNumber(totalClicks) : '—'}</div>
                  <Sparkline data={dailyClicksArr} color="var(--primary)" className="lx-sparkline" ariaLabel="Daily clicks trend" />
                  <div className="lx-kpi-footer">
                    <span className="lx-kpi-compare">{totalImpressions > 0 ? `${formatNumber(totalImpressions)} impressions` : '—'}</span>
                  </div>
                </div>

                {/* CPC */}
                <div className="lx-kpi-card">
                  <div className="lx-kpi-top">
                    <span className="lx-kpi-label">CPC</span>
                    <div className="lx-icon-pill lx-icon-pill--ads">
                      <GoogleAdsLogo />
                    </div>
                  </div>
                  <div className="lx-kpi-value">{avgCPC > 0 ? `₹${avgCPC.toFixed(2)}` : '—'}</div>
                  <Sparkline data={dailyCPC} color="#4285F4" className="lx-sparkline" ariaLabel="Daily CPC trend" />
                  <div className="lx-kpi-footer">
                    <span className="lx-kpi-compare">Per click avg</span>
                  </div>
                </div>

                {/* Conversions */}
                <div className="lx-kpi-card">
                  <div className="lx-kpi-top">
                    <span className="lx-kpi-label">Conversions</span>
                    <div className="lx-icon-pill lx-icon-pill--conv">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                    </div>
                  </div>
                  <div className="lx-kpi-value">{totalConversions > 0 ? formatNumber(Math.round(totalConversions)) : '—'}</div>
                  <Sparkline data={dailyConversions} color="#10B981" className="lx-sparkline" ariaLabel="Daily conversions trend" />
                  <div className="lx-kpi-footer">
                    <span className="lx-kpi-compare">{totalConvValue > 0 ? `${formatINR(totalConvValue, 0)} value` : '—'}</span>
                  </div>
                </div>
              </div>

              {/* ROAS strip */}
              <div className="lx-card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={20} color="#10B981" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>ROAS</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                      {formatROAS(roas, totalConvValue > 0)}
                    </div>
                  </div>
                </div>
                <span className={`lx-pill ${roas >= 3 ? 'lx-pill--success' : roas >= 1 ? 'lx-pill--info' : 'lx-pill--primary'}`}>
                  {roas >= 3 ? 'Healthy' : roas >= 1 ? 'Breakeven' : roas > 0 ? 'Losing money' : '—'}
                </span>
              </div>

              {/* Daily Spend vs Conversions chart (static mockup — real data pending) */}
              <div className="lx-card" style={{ marginBottom: 24 }}>
                <div className="lx-card-header">
                  <span className="lx-card-title">Daily Spend vs Conversions</span>
                  <span className="lx-card-action">View details →</span>
                </div>
                <div className="lx-chart-area">
                  <Sparkline data={dailyROAS} color="var(--primary)" width={600} height={200} ariaLabel="Daily spend trend" />
                </div>
                <div className="lx-chart-legend">
                  <span className="lx-legend-item"><span className="lx-legend-dot" style={{ background: '#4285F4' }} />Daily Spend</span>
                  <span className="lx-legend-item"><span className="lx-legend-dot" style={{ background: '#34A853' }} />Conversions</span>
                </div>
              </div>

              {/* Campaign Performance table */}
              <div className="lx-card" style={{ marginBottom: 24 }}>
                <div className="lx-card-header">
                  <span className="lx-card-title">Campaign Performance</span>
                  <span className="lx-pill lx-pill--primary">{enabledCampaigns} active</span>
                </div>
                <div className="lx-table-wrap">
                  <table className="lx-table">
                    <caption className="sr-only">Google Ads campaign performance</caption>
                    <thead>
                      <tr>
                        <th scope="col">Campaign</th>
                        <th scope="col">Status</th>
                        <th scope="col">Spend</th>
                        <th scope="col">Clicks</th>
                        <th scope="col">Impressions</th>
                        <th scope="col">Conversions</th>
                        <th scope="col">CPC</th>
                        <th scope="col">ROAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...campaigns].sort((a: any, b: any) => (b.cost || 0) - (a.cost || 0)).map((camp: any, i: number) => {
                        const cRoas = camp.roas > 0 ? `${camp.roas.toFixed(2)}x` : '—';
                        const cCpc = camp.avg_cpc > 0 ? `₹${camp.avg_cpc.toFixed(2)}` : '—';
                        return (
                          <tr key={camp.campaign_id || i}>
                            <td><strong>{camp.campaign_name || '—'}</strong></td>
                            <td><StatusBadge status={camp.status} /></td>
                            <td>{camp.cost > 0 ? formatINR(camp.cost, 0) : '—'}</td>
                            <td>{camp.clicks > 0 ? formatNumber(camp.clicks) : '—'}</td>
                            <td>{camp.impressions > 0 ? formatNumber(camp.impressions) : '—'}</td>
                            <td>{camp.conversions > 0 ? formatNumber(Math.round(camp.conversions)) : '—'}</td>
                            <td>{cCpc}</td>
                            <td>{cRoas}</td>
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
