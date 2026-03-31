'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, DollarSign, Eye, MousePointer, TrendingUp, RefreshCw, Play, Pause } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { useIntegrations, useMetaAdsData } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

function StatusBadge({ status }: { status: string }) {
  const { c } = useTheme();
  const s = status?.toUpperCase();
  const map: Record<string, { color: string; bg: string }> = {
    ACTIVE: { color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
    PAUSED: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
    ARCHIVED: { color: c.textMuted, bg: 'rgba(85,85,85,0.08)' },
  };
  const style = map[s] || { color: c.textMuted, bg: 'rgba(85,85,85,0.08)' };
  return (
    <span style={{ fontSize: 11, fontWeight: 500, color: style.color, backgroundColor: style.bg, padding: '3px 8px', borderRadius: 5, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {s === 'ACTIVE' ? <Play size={8} fill={style.color} /> : <Pause size={8} />}
      {status}
    </span>
  );
}

function StatCard({ icon: Icon, color, label, value, sub }: { icon: any; color: string; label: string; value: string; sub?: string }) {
  const { c } = useTheme();
  return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color: c.textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: c.text, letterSpacing: '-0.03em', lineHeight: 1.1, fontFamily: 'var(--font-mono)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function MetaAdsPage() {
  const { c } = useTheme();
  const router = useRouter();
  const { workspace, loading: wsLoading } = useWorkspaceCtx();
  const { integrations, loading: intLoading } = useIntegrations(workspace?.id);
  const { data: adsData, loading: dataLoading, refetch } = useMetaAdsData(workspace?.id);
  const [syncing, setSyncing] = useState(false);

  const integration = integrations.find(i => i.provider === 'meta_ads');
  const isConnected = integration?.status === 'connected';

  const campaigns = adsData?.campaigns || [];
  const totals = adsData?.totals;

  async function handleSync() {
    if (!integration || !workspace) return;
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/sync/meta-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ integration_id: integration.id, workspace_id: workspace.id }),
      });
      refetch();
    } catch {}
    setSyncing(false);
  }

  const loading = wsLoading || intLoading;

  const totalSpend = totals?.spend || 0;
  const totalClicks = totals?.clicks || 0;
  const totalImpressions = totals?.impressions || 0;
  const totalReach = totals?.reach || 0;
  const totalRoas = totals?.roas || 0;

  const syncButton = (
    <button
      onClick={handleSync}
      disabled={syncing}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1px solid ${c.borderStrong}`, backgroundColor: c.bgCard, color: c.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
      onMouseEnter={e => { if (!syncing) (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCardHover; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCard; }}
    >
      <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
      {syncing ? 'Syncing...' : 'Sync Now'}
    </button>
  );

  if (loading || dataLoading) return (
    <PageShell title="Meta Ads" description="Facebook & Instagram ad performance" icon={Target}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, height: 110, animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    </PageShell>
  );

  if (!isConnected) return (
    <PageShell title="Meta Ads" description="Facebook & Instagram ad performance" icon={Target}>
      <EmptyState
        icon={Target}
        title="Connect Meta Ads"
        description="Link your Meta Ads account to track Facebook & Instagram campaign performance, ROAS, and creative analytics."
        actionLabel="Connect in Settings"
        onAction={() => router.push('/dashboard/settings')}
      />
    </PageShell>
  );

  if (campaigns.length === 0) return (
    <PageShell
      title="Meta Ads"
      description="Facebook & Instagram ad performance"
      icon={Target}
      action={syncButton}
    >
      <EmptyState
        icon={Target}
        title="No campaign data yet"
        description="Your Meta Ads account is connected. Click Sync Now to pull your campaign data."
        actionLabel="Sync Now"
        onAction={handleSync}
      />
    </PageShell>
  );

  return (
    <PageShell
      title="Meta Ads"
      description="Facebook & Instagram ad performance"
      icon={Target}
      badge={integration?.last_sync_at ? `Synced ${new Date(integration.last_sync_at).toLocaleDateString()}` : undefined}
      action={syncButton}
    >
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={DollarSign} color={c.accent} label="Total Spend" value={`$${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="Last 30 days" />
        <StatCard icon={TrendingUp} color="#F59E0B" label="ROAS" value={totalRoas > 0 ? `${totalRoas.toFixed(2)}x` : '--'} sub={totalRoas >= 3 ? 'Healthy' : totalRoas >= 1 ? 'Breakeven' : 'Needs improvement'} />
        <StatCard icon={MousePointer} color="#10B981" label="Total Clicks" value={totalClicks.toLocaleString()} sub={`${totalReach.toLocaleString()} reach`} />
        <StatCard icon={Eye} color={c.textSecondary} label="Impressions" value={totalImpressions.toLocaleString()} sub="All campaigns" />
      </div>

      {/* Campaigns table */}
      <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaigns</p>
            <p style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{campaigns.length} campaigns</p>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Campaign', 'Spend', 'Clicks', 'Impressions', 'Reach', 'CTR', 'CPC', 'ROAS'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign: any, i: number) => (
                <tr key={i} style={{ borderBottom: i < campaigns.length - 1 ? `1px solid ${c.border}` : 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = c.bgCardHover}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', maxWidth: 240 }}>
                    <div style={{ fontWeight: 500, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{campaign.campaign_name}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: c.text, fontSize: 13, fontFamily: 'var(--font-mono)' }}>${(campaign.spend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: '12px 16px', color: c.textSecondary, fontSize: 13, fontFamily: 'var(--font-mono)' }}>{(campaign.clicks || 0).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', color: c.textSecondary, fontSize: 13, fontFamily: 'var(--font-mono)' }}>{(campaign.impressions || 0).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', color: c.textSecondary, fontSize: 13, fontFamily: 'var(--font-mono)' }}>{(campaign.reach || 0).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', color: campaign.ctr > 0 ? '#10B981' : c.textMuted, fontWeight: 500, fontSize: 13, fontFamily: 'var(--font-mono)' }}>{campaign.ctr > 0 ? `${campaign.ctr.toFixed(2)}%` : '--'}</td>
                  <td style={{ padding: '12px 16px', color: c.textSecondary, fontSize: 13, fontFamily: 'var(--font-mono)' }}>{campaign.cpc > 0 ? `$${campaign.cpc.toFixed(2)}` : '--'}</td>
                  <td style={{ padding: '12px 16px', color: campaign.roas > 0 ? c.accent : c.textMuted, fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-mono)' }}>{campaign.roas > 0 ? `${campaign.roas.toFixed(2)}x` : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
