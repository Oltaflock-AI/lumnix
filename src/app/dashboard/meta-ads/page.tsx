'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, TrendingUp, TrendingDown, DollarSign, MousePointer, Eye, Users, RefreshCw, ChevronDown, Download } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useIntegrations, useMetaAdsData } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatINR } from '@/lib/format';
import { apiFetch } from '@/lib/api-fetch';
import { Sparkline } from '@/components/Sparkline';

function exportCampaignsCSV(campaigns: any[]) {
  const headers = ['Campaign', 'Spend', 'Impressions', 'Clicks', 'CTR', 'CPC', 'Conversions', 'ROAS'];
  const rows = campaigns.map((c: any) => [
    c.campaign_name, c.spend, c.impressions, c.clicks,
    typeof c.ctr === 'number' ? c.ctr.toFixed(2) + '%' : c.ctr,
    typeof c.cpc === 'number' ? c.cpc.toFixed(2) : c.cpc,
    c.conversions, typeof c.roas === 'number' ? c.roas.toFixed(2) + 'x' : c.roas,
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'lumnix-meta-ads.csv'; a.click();
  URL.revokeObjectURL(url);
}

// Meta brand logo (blue infinity) — inline SVG per skin rules
function MetaLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <path d="M16.8 26.4c-4.4 5.2-7.2 12-7.2 17.6 0 6.8 2.4 11.2 6.4 11.2 3.2 0 5.6-2.4 9.6-9.6l5.2-9.6 3.2-5.6c4.8-8.4 8.8-12.8 15.2-12.8 5.6 0 10 3.2 13.6 8.8 4 6.4 6 14.4 6 22.4 0 8-3.6 13.2-10 13.2v-8.4c3.2 0 4.8-2.4 4.8-5.2 0-6-1.6-12.4-4.4-16.8-2-3.2-4.4-4.8-7.2-4.8-3.6 0-6 2.8-10 10l-5.2 9.6-3.2 5.6c-4.4 7.6-8 11.6-14.8 11.6C11.2 63.6 4 56 4 44c0-7.6 3.6-16 9.6-22.4l3.2 4.8z" fill="#0081FB"/>
    </svg>
  );
}

export default function MetaAdsPage() {
  const [days, setDays] = useState(30);
  const [syncing, setSyncing] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const router = useRouter();
  const { c, theme } = useTheme();
  const isDark = theme === 'dark';
  const { workspace, loading: wsLoading } = useWorkspaceCtx();
  const workspaceId = workspace?.id;

  const { integrations, loading: intLoading } = useIntegrations(workspaceId);
  const metaIntegration = integrations.find((i: any) => i.provider === 'meta_ads' && i.status === 'connected');

  const { data: metaData, loading: dataLoading, refetch } = useMetaAdsData(workspaceId, days);

  const loading = wsLoading || intLoading || dataLoading;

  // Load ad accounts when integration exists
  useEffect(() => {
    if (!metaIntegration?.id || !workspaceId) return;
    apiFetch(`/api/meta/accounts?integration_id=${metaIntegration.id}&workspace_id=${workspaceId}`)
      .then(r => r.json())
      .then(d => {
        const accts = d.accounts || [];
        setAccounts(accts);
        // Default to saved account or first
        const saved = metaIntegration.oauth_meta?.ad_account_id;
        if (saved && accts.some((a: any) => a.id === saved)) {
          setSelectedAccountId(saved);
        } else if (accts.length > 0) {
          setSelectedAccountId(accts[0].id);
        }
      })
      .catch(() => {});
  }, [metaIntegration?.id]);

  const campaigns: any[] = metaData?.campaigns || [];
  const totals = metaData?.totals;
  const daily = metaData?.daily || [];
  const hasData = campaigns.length > 0;
  const [showInactive, setShowInactive] = useState(false);

  // Split campaigns: active (spend > 0) vs inactive (spend === 0) — memoized
  const { activeCampaigns, inactiveCampaigns, totalSpend, topPerformer } = useMemo(() => {
    const active = campaigns.filter((c: any) => (c.spend || 0) > 0);
    const inactive = campaigns.filter((c: any) => (c.spend || 0) === 0);
    const spend = campaigns.reduce((s: number, c: any) => s + (c.spend || 0), 0);
    const top = active.length > 0
      ? active.reduce((best: any, c: any) => (c.spend || 0) > (best.spend || 0) ? c : best, active[0])
      : null;
    return { activeCampaigns: active, inactiveCampaigns: inactive, totalSpend: spend, topPerformer: top };
  }, [campaigns]);
  const topPerformerDominant = topPerformer && totalSpend > 0 && ((topPerformer.spend || 0) / totalSpend) > 0.5;

  const handleSync = useCallback(async (accountId?: string) => {
    if (!workspaceId || !metaIntegration) return;
    setSyncing(true);
    try {
      const res = await apiFetch('/api/sync/meta-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_id: metaIntegration.id,
          workspace_id: workspaceId,
          ad_account_id: accountId || selectedAccountId || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Sync failed');
      } else {
        refetch();
      }
    } catch (err) {
      alert('Sync failed — check your connection');
    } finally {
      setSyncing(false);
    }
  }, [workspaceId, metaIntegration, selectedAccountId, refetch]);

  const handleAccountSwitch = useCallback(async (accountId: string) => {
    setSelectedAccountId(accountId);
    setAccountDropdownOpen(false);
    await handleSync(accountId);
  }, [handleSync]);

  const tooltipStyle = useMemo(
    () => ({ backgroundColor: c.bgCard, border: `1px solid ${c.borderStrong}`, borderRadius: 8, color: c.text, fontSize: 12 }),
    [c.bgCard, c.borderStrong, c.text]
  );

  // Derived KPI displays (use — for missing)
  const spendDisplay = totals ? formatINR(totals.spend) : '—';
  const reachDisplay = totals && typeof totals.reach === 'number' && totals.reach > 0 ? formatNumber(totals.reach) : '—';
  const cpmDisplay = totals && totals.impressions > 0
    ? formatINR((totals.spend / totals.impressions) * 1000, 2)
    : '—';
  const roasDisplay = totals && totals.roas > 0 ? totals.roas.toFixed(2) + 'x' : '—';

  // Placement mix aggregation — TODO: plug real placement breakdown when API exposes it
  // For now show — when no breakdown. impressionsTotal used for donut center label.
  const impressionsTotal = totals?.impressions ?? 0;

  // Daily series for KPI sparklines
  const dailySpendArr = useMemo(() => daily.map((d: any) => d.spend || 0), [daily]);
  const dailyReachArr = useMemo(() => daily.map((d: any) => d.reach || 0), [daily]);
  const dailyCPMArr = useMemo(
    () => daily.map((d: any) => (d.impressions > 0 ? ((d.spend || 0) / d.impressions) * 1000 : 0)),
    [daily]
  );
  // Per-day ROAS not exposed (no conversion_value in daily) — fall back to spend trend
  const dailyROASArr = dailySpendArr;

  // Not connected state
  if (!loading && !metaIntegration) {
    return (
      <PageShell title="Meta Ads" description="Facebook & Instagram ad performance" icon={Share2}>
        <EmptyState
          icon={Share2}
          title="Connect Meta Ads"
          description="Link your Meta Ads account to see campaign performance, spend, and ROAS."
          actionLabel="Connect in Settings"
          onAction={() => router.push('/dashboard/settings')}
        />
      </PageShell>
    );
  }

  const selectedAccount = accounts.find((a: any) => a.id === selectedAccountId);

  return (
    <PageShell
      title="Meta Ads"
      description="Facebook & Instagram ad performance"
      icon={Share2}
      action={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Account Switcher */}
          {accounts.length > 1 && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="lx-btn-outline"
              >
                {selectedAccount?.name || 'Select Account'}
                <ChevronDown size={14} />
              </button>
              {accountDropdownOpen && (
                <div className="lx-date-dropdown open" style={{ right: 0 }}>
                  {accounts.map((acct: any) => (
                    <button
                      key={acct.id}
                      onClick={() => handleAccountSwitch(acct.id)}
                      className={`lx-date-option ${acct.id === selectedAccountId ? 'active' : ''}`}
                    >
                      <div>{acct.name}</div>
                      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{acct.id} · {acct.currency}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {accounts.length === 1 && (
            <span style={{ fontSize: 12, color: c.textMuted }}>
              {accounts[0].name}
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSync()}
            disabled={syncing}
            style={{ gap: 6 }}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>

          <DateRangePicker value={days} onChange={setDays} />
        </div>
      }
    >
      {loading && (
        <>
          <div className="lx-kpi-grid">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
          </div>
          <Skeleton className="h-[260px] rounded-xl" />
        </>
      )}

      {!loading && !hasData && (
        <EmptyState
          icon={Share2}
          title="No Meta Ads data yet"
          description={metaIntegration ? "Click Sync Now to pull your Meta Ads campaign data." : "Connect your Meta Ads account in Settings to get started."}
          actionLabel={syncing ? 'Syncing...' : 'Sync Now'}
          onAction={() => handleSync()}
        />
      )}

      {!loading && hasData && totals && (
        <>
          {/* Welcome header */}
          <div className="lx-welcome">
            <h1>Lumnix – <span>Meta Ads</span></h1>
            <div className="lx-welcome-sub">
              <span className="lx-welcome-dot"></span>
              Performance across Facebook, Instagram &amp; Threads · {days}-day analysis
            </div>
          </div>

          {/* KPI Cards */}
          <div className="lx-kpi-grid">
            {/* Spend */}
            <div className="lx-kpi-card">
              <div className="lx-kpi-top">
                <span className="lx-kpi-label">Spend</span>
                <div className="lx-icon-pill lx-icon-pill--meta"><MetaLogo /></div>
              </div>
              <div className="lx-kpi-value">{spendDisplay}</div>
              <Sparkline data={dailySpendArr} color="#0081FB" className="lx-sparkline" ariaLabel="Daily spend trend" />
              <div className="lx-kpi-footer">
                <span className="lx-kpi-compare">{days}-day total</span>
              </div>
            </div>

            {/* Reach */}
            <div className="lx-kpi-card">
              <div className="lx-kpi-top">
                <span className="lx-kpi-label">Reach</span>
                <div className="lx-icon-pill lx-icon-pill--meta"><MetaLogo /></div>
              </div>
              <div className="lx-kpi-value">{reachDisplay}</div>
              <Sparkline data={dailyReachArr} color="var(--primary)" className="lx-sparkline" ariaLabel="Daily reach trend" />
              <div className="lx-kpi-footer">
                <span className="lx-kpi-compare">Unique users reached</span>
              </div>
            </div>

            {/* CPM */}
            <div className="lx-kpi-card">
              <div className="lx-kpi-top">
                <span className="lx-kpi-label">CPM</span>
                <div className="lx-icon-pill lx-icon-pill--meta"><MetaLogo /></div>
              </div>
              <div className="lx-kpi-value">{cpmDisplay}</div>
              <Sparkline data={dailyCPMArr} color="#F59E0B" className="lx-sparkline" ariaLabel="Daily CPM trend" />
              <div className="lx-kpi-footer">
                <span className="lx-kpi-compare">Cost per 1K impressions</span>
              </div>
            </div>

            {/* ROAS */}
            <div className="lx-kpi-card">
              <div className="lx-kpi-top">
                <span className="lx-kpi-label">ROAS</span>
                <div className="lx-icon-pill lx-icon-pill--meta"><MetaLogo /></div>
              </div>
              <div className="lx-kpi-value">{roasDisplay}</div>
              <Sparkline data={dailyROASArr} color="#10B981" className="lx-sparkline" ariaLabel="Daily ROAS trend" />
              <div className="lx-kpi-footer">
                <span className="lx-kpi-compare">Return on ad spend</span>
              </div>
            </div>
          </div>

          {/* Reach & Impressions Chart */}
          {daily.length > 1 && (
            <div className="lx-card" style={{ marginBottom: 24 }}>
              <div className="lx-card-header">
                <span className="lx-card-title">Reach &amp; Impressions ({days} Days)</span>
              </div>
              <div className="lx-chart-area" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily}>
                    <defs>
                      <linearGradient id="gradMetaReach" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0081FB" stopOpacity={0.2}/>
                        <stop offset="100%" stopColor="#0081FB" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gradMetaImpr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.15}/>
                        <stop offset="100%" stopColor="#00D4AA" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: c.textMuted }} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: c.textMuted }} tickLine={false} axisLine={false} width={50} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="impressions" stroke="#00D4AA" strokeWidth={2} fill="url(#gradMetaImpr)" name="Impressions" />
                    <Area type="monotone" dataKey="reach" stroke="#0081FB" strokeWidth={2.5} fill="url(#gradMetaReach)" name="Reach" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="lx-chart-legend">
                <span className="lx-legend-item"><span className="lx-legend-dot" style={{ background: '#0081FB' }}></span>Reach</span>
                <span className="lx-legend-item"><span className="lx-legend-dot" style={{ background: '#00D4AA' }}></span>Impressions</span>
              </div>
            </div>
          )}

          {/* Top Performer Callout */}
          {topPerformerDominant && topPerformer && (
            <div style={{
              background: isDark ? 'rgba(5,150,105,0.08)' : 'rgba(5,150,105,0.04)',
              border: '1px solid #A7F3D0',
              borderLeft: '3px solid #059669',
              borderRadius: '0 10px 10px 0',
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>
                ⭐ Top performer: &ldquo;{topPerformer.campaign_name || topPerformer.name}&rdquo;
              </span>
              <span style={{ fontSize: 12, color: isDark ? '#6EE7B7' : '#6B7280' }}>
                {formatINR(topPerformer.spend)} spend · {formatNumber(topPerformer.impressions || 0)} impressions · {typeof topPerformer.ctr === 'number' ? topPerformer.ctr.toFixed(2) : '0'}% CTR
              </span>
            </div>
          )}

          {/* 60/40 grid — Ad Set Performance + Placement Mix */}
          <div className="lx-grid-60-40">
            {/* Campaign performance table */}
            <div className="lx-card">
              <div className="lx-card-header">
                <span className="lx-card-title">Campaign Performance</span>
                <button className="lx-card-action" onClick={() => exportCampaignsCSV(campaigns)}>
                  <Download size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Export CSV
                </button>
              </div>
              <table className="lx-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th>Spend</th>
                    <th>Clicks</th>
                    <th>CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCampaigns.slice(0, 6).map((camp: any, i: number) => (
                    <tr key={`active-${i}`}>
                      <td><strong>{camp.campaign_name || camp.name || 'Unknown'}</strong></td>
                      <td><span className="lx-pill lx-pill--primary">Active</span></td>
                      <td>{typeof camp.spend === 'number' ? formatINR(camp.spend) : '—'}</td>
                      <td>{typeof camp.clicks === 'number' ? formatNumber(camp.clicks) : '—'}</td>
                      <td>{typeof camp.ctr === 'number' ? camp.ctr.toFixed(2) + '%' : '—'}</td>
                    </tr>
                  ))}
                  {inactiveCampaigns.length > 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 0 }}>
                        <button
                          onClick={() => setShowInactive(!showInactive)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '10px 16px',
                            fontSize: 12, color: c.textMuted,
                            background: 'none', border: 'none', cursor: 'pointer',
                          }}
                        >
                          <div style={{ flex: 1, height: 1, background: c.border }} />
                          <span>{showInactive ? '↑ Hide' : '↓ Show'} {inactiveCampaigns.length} inactive</span>
                          <div style={{ flex: 1, height: 1, background: c.border }} />
                        </button>
                      </td>
                    </tr>
                  )}
                  {showInactive && inactiveCampaigns.slice(0, 6).map((camp: any, i: number) => (
                    <tr key={`inactive-${i}`} style={{ opacity: 0.5 }}>
                      <td>{camp.campaign_name || camp.name || 'Unknown'}</td>
                      <td><span className="lx-pill" style={{ background: c.bgCard, color: c.textMuted }}>Paused</span></td>
                      <td>—</td>
                      <td>{typeof camp.clicks === 'number' ? formatNumber(camp.clicks) : '0'}</td>
                      <td>—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Placement Mix */}
            <div className="lx-card">
              <div className="lx-card-header">
                <span className="lx-card-title">Placement Mix</span>
                <span className="lx-pill lx-pill--primary">{days} days</span>
              </div>
              {/* TODO: replace placeholder placement breakdown with real API data when Meta insights placement-level field is added */}
              <div className="lx-donut-wrap">
                <div className="lx-donut-chart">
                  <svg viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="56" fill="none" stroke={c.border} strokeWidth="14"/>
                    <circle cx="70" cy="70" r="56" fill="none" stroke="#FF0066" strokeWidth="14" strokeDasharray="145.6 253.4" strokeDashoffset="0" transform="rotate(-90 70 70)"/>
                    <circle cx="70" cy="70" r="56" fill="none" stroke="#00D4AA" strokeWidth="14" strokeDasharray="79.7 298.4" strokeDashoffset="-145.6" transform="rotate(-90 70 70)"/>
                    <circle cx="70" cy="70" r="56" fill="none" stroke="#7B61FF" strokeWidth="14" strokeDasharray="39.8 338.3" strokeDashoffset="-225.3" transform="rotate(-90 70 70)"/>
                    <circle cx="70" cy="70" r="56" fill="none" stroke="#FF8A00" strokeWidth="14" strokeDasharray="21.1 359.4" strokeDashoffset="-265.1" transform="rotate(-90 70 70)"/>
                    <text x="70" y="65" textAnchor="middle" fill={c.text} fontFamily="Outfit" fontSize="20" fontWeight="700">
                      {impressionsTotal > 0 ? formatNumber(impressionsTotal) : '—'}
                    </text>
                    <text x="70" y="82" textAnchor="middle" fill={c.textMuted} fontFamily="Plus Jakarta Sans" fontSize="10">impressions</text>
                  </svg>
                </div>
                <div className="lx-donut-legend">
                  <div className="lx-donut-row">
                    <span className="lx-donut-color" style={{ background: '#FF0066' }}></span>
                    <span className="lx-donut-label">Feed</span>
                    <span className="lx-donut-val">—</span>
                    <span className="lx-donut-pct">—</span>
                  </div>
                  <div className="lx-donut-row">
                    <span className="lx-donut-color" style={{ background: '#00D4AA' }}></span>
                    <span className="lx-donut-label">Stories</span>
                    <span className="lx-donut-val">—</span>
                    <span className="lx-donut-pct">—</span>
                  </div>
                  <div className="lx-donut-row">
                    <span className="lx-donut-color" style={{ background: '#7B61FF' }}></span>
                    <span className="lx-donut-label">Reels</span>
                    <span className="lx-donut-val">—</span>
                    <span className="lx-donut-pct">—</span>
                  </div>
                  <div className="lx-donut-row">
                    <span className="lx-donut-color" style={{ background: '#FF8A00' }}></span>
                    <span className="lx-donut-label">Other</span>
                    <span className="lx-donut-val">—</span>
                    <span className="lx-donut-pct">—</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Creative Performance — top campaigns as creative cards */}
          <div className="lx-card" style={{ marginBottom: 24 }}>
            <div className="lx-card-header">
              <span className="lx-card-title">Creative Performance</span>
              <span className="lx-card-action">Top campaigns by spend</span>
            </div>
            {/* TODO: swap card preview for real ad creative thumbnails when Meta creative API is integrated */}
            <div className="lx-grid-3" style={{ margin: 0 }}>
              {activeCampaigns.slice(0, 3).map((camp: any, i: number) => (
                <div key={`creative-${i}`} className="lx-ad-card">
                  <div className="lx-ad-preview">[Ad Creative Preview]</div>
                  <div className="lx-ad-info">
                    <div className="lx-ad-title">
                      {camp.campaign_name || camp.name || 'Unknown'}
                    </div>
                    <div className="lx-ad-metrics">
                      <span>Spend: {typeof camp.spend === 'number' ? formatINR(camp.spend) : '—'}</span>
                      <span>CTR: {typeof camp.ctr === 'number' ? camp.ctr.toFixed(2) + '%' : '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {activeCampaigns.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: 16, color: c.textMuted, fontSize: 13 }}>
                  No active creatives to display.
                </div>
              )}
            </div>
          </div>

          {/* Last synced */}
          {metaIntegration?.last_sync_at && (
            <div style={{ textAlign: 'center', fontSize: 11, color: c.textMuted, marginTop: 16, fontFamily: "'DM Sans', sans-serif" }}>
              Last synced: {new Date(metaIntegration.last_sync_at).toLocaleString('en-IN')}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
