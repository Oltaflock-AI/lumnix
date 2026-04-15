'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, TrendingUp, TrendingDown, DollarSign, MousePointer, Eye, Users, RefreshCw, ChevronDown, Download } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useWorkspace, useIntegrations, useMetaAdsData } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatINR } from '@/lib/format';

const COLORS = ['#1877F2', '#7C3AED', '#0891B2', '#10B981', '#F59E0B', '#ec4899'];

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
    if (!metaIntegration?.id) return;
    fetch(`/api/meta/accounts?integration_id=${metaIntegration.id}`)
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

  const campaigns = metaData?.campaigns || [];
  const totals = metaData?.totals;
  const daily = metaData?.daily || [];
  const hasData = campaigns.length > 0;
  const [showInactive, setShowInactive] = useState(false);

  // Split campaigns: active (spend > 0) vs inactive (spend === 0)
  const activeCampaigns = campaigns.filter((c: any) => (c.spend || 0) > 0);
  const inactiveCampaigns = campaigns.filter((c: any) => (c.spend || 0) === 0);

  // Top performer detection
  const totalSpend = campaigns.reduce((s: number, c: any) => s + (c.spend || 0), 0);
  const topPerformer = activeCampaigns.length > 0
    ? activeCampaigns.reduce((best: any, c: any) => (c.spend || 0) > (best.spend || 0) ? c : best, activeCampaigns[0])
    : null;
  const topPerformerDominant = topPerformer && totalSpend > 0 && ((topPerformer.spend || 0) / totalSpend) > 0.5;

  async function handleSync(accountId?: string) {
    if (!workspaceId || !metaIntegration) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/sync/meta-ads', {
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
  }

  async function handleAccountSwitch(accountId: string) {
    setSelectedAccountId(accountId);
    setAccountDropdownOpen(false);
    await handleSync(accountId);
  }

  const tooltipStyle = { backgroundColor: c.bgCard, border: `1px solid ${c.borderStrong}`, borderRadius: 8, color: c.text, fontSize: 12 };

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
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8,
                  backgroundColor: c.bgCard, border: `1px solid ${c.border}`,
                  color: c.text, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {selectedAccount?.name || 'Select Account'}
                <ChevronDown size={14} color={c.textMuted} />
              </button>
              {accountDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4,
                  backgroundColor: c.bgCard, border: `1px solid ${c.border}`,
                  borderRadius: 10, padding: 4, minWidth: 220, zIndex: 50,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                }}>
                  {accounts.map((acct: any) => (
                    <button
                      key={acct.id}
                      onClick={() => handleAccountSwitch(acct.id)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 12px', borderRadius: 6, border: 'none',
                        backgroundColor: acct.id === selectedAccountId ? (isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)') : 'transparent',
                        color: acct.id === selectedAccountId ? '#7C3AED' : c.text,
                        fontSize: 13, fontWeight: acct.id === selectedAccountId ? 600 : 400,
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      }}
                      onMouseEnter={e => { if (acct.id !== selectedAccountId) (e.target as HTMLElement).style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'; }}
                      onMouseLeave={e => { if (acct.id !== selectedAccountId) (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
                    >
                      <div>{acct.name}</div>
                      <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{acct.id} · {acct.currency}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Single account display */}
          {accounts.length === 1 && (
            <span style={{ fontSize: 12, color: c.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
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
        </div>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <DateRangePicker value={days} onChange={setDays} />
      </div>

      {loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
          </div>
          <Skeleton className="h-[250px] rounded-xl" />
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
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { key: 'spend', label: 'Total Spend', value: formatINR(totals.spend), icon: DollarSign, color: '#1877F2' },
              { key: 'impressions', label: 'Impressions', value: formatNumber(totals.impressions), icon: Eye, color: '#7C3AED' },
              { key: 'clicks', label: 'Clicks', value: formatNumber(totals.clicks), icon: MousePointer, color: '#0891B2' },
              { key: 'ctr', label: 'Avg CTR', value: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) + '%' : '0%', icon: TrendingUp, color: '#10B981' },
            ].map(k => (
              <div key={k.key} style={{
                backgroundColor: c.bgCard, border: `1px solid ${c.border}`,
                borderRadius: 12, padding: 18,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: `${k.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <k.icon size={14} color={k.color} />
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
                </div>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 26, fontWeight: 700, color: c.text,
                  letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
                }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Secondary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Reach', value: formatNumber(totals.reach) },
              { label: 'Conversions', value: formatNumber(totals.conversions) },
              { label: 'ROAS', value: totals.roas > 0 ? totals.roas.toFixed(2) + 'x' : '—' },
            ].map(k => (
              <div key={k.label} style={{
                backgroundColor: c.bgCard, border: `1px solid ${c.border}`,
                borderRadius: 12, padding: '14px 18px',
              }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: c.text, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Spend Trend Chart */}
          {daily.length > 1 && (
            <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: '20px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Daily Spend Trend
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={daily}>
                  <defs>
                    <linearGradient id="metaSpendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1877F2" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#1877F2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: c.textMuted }} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: c.textMuted }} tickLine={false} axisLine={false} width={50} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatINR(v), 'Spend']} labelFormatter={(l: string) => l} />
                  <Area type="monotone" dataKey="spend" stroke="#1877F2" strokeWidth={2} fill="url(#metaSpendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Clicks + Impressions Chart */}
          {daily.length > 1 && (
            <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: '20px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Clicks & Impressions
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={daily}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: c.textMuted }} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: c.textMuted }} tickLine={false} axisLine={false} width={50} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="clicks" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Clicks" />
                  <Bar dataKey="impressions" fill="#0891B220" radius={[4, 4, 0, 0]} name="Impressions" />
                </BarChart>
              </ResponsiveContainer>
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
              marginBottom: 14,
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

          {/* Campaigns Table */}
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${c.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: c.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Campaigns ({activeCampaigns.length} active{inactiveCampaigns.length > 0 ? ` · ${inactiveCampaigns.length} inactive` : ''})
              </div>
              <Button variant="ghost" size="sm" onClick={() => exportCampaignsCSV(campaigns)} style={{ gap: 4 }}>
                <Download size={13} /> Export
              </Button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                    {['Campaign', 'Spend', 'Impressions', 'Clicks', 'CTR', 'CPC', 'Conv.', 'ROAS'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Campaign' ? 'left' : 'right', fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeCampaigns.map((camp: any, i: number) => (
                    <tr key={`active-${i}`} style={{ borderBottom: `1px solid ${c.border}` }}>
                      <td style={{ padding: '12px 16px', color: c.text, fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {camp.campaign_name || camp.name || 'Unknown'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: c.text, fontVariantNumeric: 'tabular-nums' }}>
                        {typeof camp.spend === 'number' ? formatINR(camp.spend) : camp.spend}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: c.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                        {typeof camp.impressions === 'number' ? formatNumber(camp.impressions) : camp.impressions}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: c.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                        {typeof camp.clicks === 'number' ? formatNumber(camp.clicks) : camp.clicks}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: c.textSecondary }}>
                        {typeof camp.ctr === 'number' ? camp.ctr.toFixed(2) + '%' : camp.ctr}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: c.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                        {typeof camp.cpc === 'number' ? formatINR(camp.cpc, 2) : camp.cpc}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: c.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                        {typeof camp.conversions === 'number' ? formatNumber(camp.conversions) : camp.conversions}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: camp.roas > 1 ? (isDark ? '#34D399' : '#059669') : c.textSecondary }}>
                        {typeof camp.roas === 'number' ? (camp.roas > 0 ? camp.roas.toFixed(2) + 'x' : '—') : camp.roas}
                      </td>
                    </tr>
                  ))}
                  {inactiveCampaigns.length > 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: 0 }}>
                        <button
                          onClick={() => setShowInactive(!showInactive)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '10px 16px',
                            fontSize: 12, color: '#A09CC0',
                            background: 'none', border: 'none', cursor: 'pointer',
                          }}
                        >
                          <div style={{ flex: 1, height: 1, background: c.border }} />
                          <span>{showInactive ? '↑ Hide' : '↓ Show'} {inactiveCampaigns.length} inactive campaign{inactiveCampaigns.length > 1 ? 's' : ''} (₹0 spend)</span>
                          <div style={{ flex: 1, height: 1, background: c.border }} />
                        </button>
                      </td>
                    </tr>
                  )}
                  {showInactive && inactiveCampaigns.map((camp: any, i: number) => (
                    <tr key={`inactive-${i}`} style={{ borderBottom: `1px solid ${c.border}`, opacity: 0.5 }}>
                      <td style={{ padding: '12px 16px', color: c.textMuted, fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {camp.campaign_name || camp.name || 'Unknown'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: c.textMuted, fontVariantNumeric: 'tabular-nums' }}>—</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: c.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                        {typeof camp.impressions === 'number' ? formatNumber(camp.impressions) : '0'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: c.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                        {typeof camp.clicks === 'number' ? formatNumber(camp.clicks) : '0'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: c.textMuted }}>—</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: c.textMuted }}>—</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: c.textMuted }}>—</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: c.textMuted }}>—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
