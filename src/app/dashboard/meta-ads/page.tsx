'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, DollarSign, Eye, MousePointer, TrendingUp, RefreshCw, Play, Pause, AlertCircle } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { useWorkspace, useIntegrations } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const map: Record<string, { color: string; bg: string }> = {
    ACTIVE: { color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
    PAUSED: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
    ARCHIVED: { color: '#9ca3af', bg: 'rgba(156,163,175,0.08)' },
  };
  const style = map[s] || { color: '#9ca3af', bg: 'rgba(156,163,175,0.08)' };
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
    <div style={{ backgroundColor: c.bgCard, borderRadius: 14, padding: 24, boxShadow: c.shadow }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color: c.textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: c.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function MetaAdsPage() {
  const router = useRouter();
  const { workspace, loading: wsLoading } = useWorkspaceCtx();
  const { integrations, loading: intLoading } = useIntegrations(workspace?.id);
  const [syncing, setSyncing] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

  const integration = integrations.find(i => i.provider === 'meta_ads');
  const isConnected = integration?.status === 'connected';

  useEffect(() => {
    if (!workspace?.id) return;
    async function load() {
      setDataLoading(true);
      const { data } = await supabase
        .from('analytics_data')
        .select('data, synced_at')
        .eq('workspace_id', workspace.id)
        .eq('provider', 'meta_ads')
        .order('synced_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.data && Array.isArray(data.data)) {
        setCampaigns(data.data);
        setSyncedAt(data.synced_at);
      }
      setDataLoading(false);
    }
    load();
  }, [workspace?.id]);

  async function handleSync() {
    if (!integration || !workspace) return;
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sync/meta-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ integration_id: integration.id, workspace_id: workspace.id }),
      });
      const json = await res.json();
      // Reload
      const { data } = await supabase
        .from('analytics_data')
        .select('data, synced_at')
        .eq('workspace_id', workspace.id)
        .eq('provider', 'meta_ads')
        .order('synced_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.data && Array.isArray(data.data)) {
        setCampaigns(data.data);
        setSyncedAt(data.synced_at);
      }
    } catch {}
    setSyncing(false);
  }

  const loading = wsLoading || intLoading;

  // Aggregate stats from real data
  const totalSpend = campaigns.reduce((s, c) => {
    const v = parseFloat(String(c.spend || '0').replace(/[$,]/g, ''));
    return s + (isNaN(v) ? 0 : v);
  }, 0);
  const totalClicks = campaigns.reduce((s, c) => {
    const v = parseInt(String(c.clicks || '0').replace(/,/g, ''));
    return s + (isNaN(v) ? 0 : v);
  }, 0);
  const totalImpressions = campaigns.reduce((s, c) => {
    const v = parseInt(String(c.impressions || '0').replace(/,/g, ''));
    return s + (isNaN(v) ? 0 : v);
  }, 0);
  const activeCampaigns = campaigns.filter(c => c.status?.toUpperCase() === 'ACTIVE').length;

  const { c } = useTheme();

  if (loading || dataLoading) return (
    <PageShell title="Meta Ads" description="Facebook & Instagram ad performance" icon={Target}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ backgroundColor: '#FFFFFF', borderRadius: 14, height: 110, boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
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
      action={
        <button onClick={handleSync} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      }
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
      badge={syncedAt ? `Synced ${new Date(syncedAt).toLocaleDateString()}` : undefined}
      action={
        <button onClick={handleSync} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      }
    >
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={DollarSign} color="#7C3AED" label="Total Spend" value={`$${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} sub="Last 30 days" />
        <StatCard icon={Eye} color="#3b82f6" label="Impressions" value={totalImpressions.toLocaleString()} sub="All campaigns" />
        <StatCard icon={MousePointer} color="#10B981" label="Total Clicks" value={totalClicks.toLocaleString()} sub="All campaigns" />
        <StatCard icon={TrendingUp} color="#F59E0B" label="Active Campaigns" value={String(activeCampaigns)} sub={`${campaigns.length} total`} />
      </div>

      {/* Campaigns table */}
      <div style={{ backgroundColor: c.bgCard, borderRadius: 14, boxShadow: c.shadow, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Campaigns</p>
            <p style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{campaigns.length} campaigns · {activeCampaigns} active</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, backgroundColor: 'rgba(16,185,129,0.08)', color: '#10B981', fontWeight: 500 }}>{activeCampaigns} Active</span>
            <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, backgroundColor: 'rgba(245,158,11,0.08)', color: '#F59E0B', fontWeight: 500 }}>{campaigns.filter(c => c.status?.toUpperCase() === 'PAUSED').length} Paused</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: c.bgCardHover }}>
                {['Campaign', 'Status', 'Budget', 'Spend', 'Impressions', 'Clicks', 'CTR', 'CPC', 'ROAS'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign: any, i: number) => (
                <tr key={i} style={{ borderBottom: i < campaigns.length - 1 ? `1px solid ${c.borderSubtle}` : 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = c.bgCardHover}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', maxWidth: 240 }}>
                    <div style={{ fontWeight: 500, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{campaign.name}</div>
                    {campaign.objective && <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>{campaign.objective.replace('OUTCOME_', '')}</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={campaign.status || 'UNKNOWN'} /></td>
                  <td style={{ padding: '12px 16px', color: c.textSecondary, fontSize: 13 }}>{campaign.budget || '—'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: c.text, fontSize: 13 }}>{campaign.spend || '$0'}</td>
                  <td style={{ padding: '12px 16px', color: c.textSecondary, fontSize: 13 }}>{campaign.impressions || '0'}</td>
                  <td style={{ padding: '12px 16px', color: c.textSecondary, fontSize: 13 }}>{campaign.clicks || '0'}</td>
                  <td style={{ padding: '12px 16px', color: campaign.ctr && campaign.ctr !== '0%' ? '#10B981' : c.textMuted, fontWeight: 500, fontSize: 13 }}>{campaign.ctr || '—'}</td>
                  <td style={{ padding: '12px 16px', color: c.textSecondary, fontSize: 13 }}>{campaign.cpc || '—'}</td>
                  <td style={{ padding: '12px 16px', color: campaign.roas && campaign.roas !== '-' ? '#7C3AED' : c.textMuted, fontWeight: 600, fontSize: 13 }}>{campaign.roas || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
