'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, DollarSign, Eye, MousePointer, TrendingUp, RefreshCw, AlertCircle, Zap, BarChart3, Users, Play, Pause } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { useWorkspace, useIntegrations } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

function StatCard({ icon: Icon, color, label, value, sub }: { icon: any; color: string; label: string; value: string; sub?: string }) {
  return (
    <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontSize: 12, color: '#71717a', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#52525b', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    ACTIVE: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    PAUSED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    ARCHIVED: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  };
  const s = map[status?.toUpperCase()] || { color: '#71717a', bg: 'rgba(113,113,122,0.1)' };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: s.color, backgroundColor: s.bg, padding: '3px 8px', borderRadius: 5, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {status?.toUpperCase() === 'ACTIVE' ? <Play size={9} /> : <Pause size={9} />}
      {status}
    </span>
  );
}

const DEMO_CAMPAIGNS = [
  { name: 'Brand Awareness — Q1', status: 'ACTIVE', budget: '$120/day', spend: '$2,840', impressions: '184,200', clicks: '3,920', ctr: '2.13%', cpc: '$0.72', roas: '3.4x' },
  { name: 'Retargeting — Website Visitors', status: 'ACTIVE', budget: '$60/day', spend: '$1,210', impressions: '42,600', clicks: '1,840', ctr: '4.32%', cpc: '$0.66', roas: '5.1x' },
  { name: 'Lookalike Audience — Converters', status: 'PAUSED', budget: '$80/day', spend: '$940', impressions: '61,000', clicks: '980', ctr: '1.61%', cpc: '$0.96', roas: '2.2x' },
  { name: 'Cold Traffic — Interest Targeting', status: 'ACTIVE', budget: '$45/day', spend: '$680', impressions: '93,400', clicks: '720', ctr: '0.77%', cpc: '$0.94', roas: '1.8x' },
];

const DEMO_ADS = [
  { name: 'Hero Image — Product Shot', campaign: 'Brand Awareness — Q1', impressions: '62,400', clicks: '1,820', ctr: '2.92%', spend: '$980', roas: '4.1x' },
  { name: 'Video — 15s Testimonial', campaign: 'Brand Awareness — Q1', impressions: '54,200', clicks: '1,240', ctr: '2.29%', spend: '$740', roas: '3.2x' },
  { name: 'Carousel — Feature Highlights', campaign: 'Retargeting', impressions: '28,400', clicks: '1,140', ctr: '4.01%', spend: '$560', roas: '5.8x' },
  { name: 'Dynamic — Catalog Ads', campaign: 'Retargeting', impressions: '14,200', clicks: '700', ctr: '4.93%', spend: '$650', roas: '4.7x' },
];

export default function MetaAdsPage() {
  const router = useRouter();
  const { workspace, loading: wsLoading } = useWorkspace();
  const { integrations, loading: intLoading } = useIntegrations(workspace?.id);
  const [syncing, setSyncing] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const integration = integrations.find(i => i.provider === 'meta_ads');
  const isConnected = integration?.status === 'connected';
  const loading = wsLoading || intLoading;

  useEffect(() => {
    if (!workspace?.id || !isConnected) return;
    async function load() {
      setDataLoading(true);
      const { data } = await supabase
        .from('analytics_data')
        .select('*')
        .eq('workspace_id', workspace.id)
        .eq('provider', 'meta_ads')
        .order('synced_at', { ascending: false })
        .limit(1)
        .single();
      if (data?.data) setCampaigns(data.data);
      setDataLoading(false);
    }
    load();
  }, [workspace?.id, isConnected]);

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
    } catch {}
    setSyncing(false);
  }

  // Use real campaigns if available, otherwise demo data (when connected but no sync yet)
  const displayCampaigns = campaigns.length > 0 ? campaigns : (isConnected ? DEMO_CAMPAIGNS : DEMO_CAMPAIGNS);
  const isDemo = campaigns.length === 0;

  if (loading) return (
    <PageShell title="Meta Ads" description="Facebook & Instagram ad performance" icon={Target}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 12, height: 100 }} />
        ))}
      </div>
    </PageShell>
  );

  if (!isConnected) return (
    <PageShell title="Meta Ads" description="Facebook & Instagram ad performance" icon={Target}>
      <EmptyState
        icon={Target}
        title="Connect Meta Ads"
        description="Link your Meta Ads account to track Facebook & Instagram campaign performance, creative analytics, ROAS, and ad fatigue alerts."
        actionLabel="Connect in Settings"
        onAction={() => router.push('/dashboard/settings')}
      />
      <div style={{ marginTop: 24 }}>
        <p style={{ fontSize: 13, color: '#52525b', marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview — what you'll see when connected</p>
        <div style={{ opacity: 0.4, pointerEvents: 'none' }}>
          <MetaAdsContent campaigns={DEMO_CAMPAIGNS} ads={DEMO_ADS} isDemo syncing={false} onSync={() => {}} />
        </div>
      </div>
    </PageShell>
  );

  return (
    <PageShell title="Meta Ads" description="Facebook & Instagram ad performance" icon={Target}
      badge={isDemo ? 'Demo Data' : 'Live'}
      action={
        <button onClick={handleSync} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #3f3f46', backgroundColor: '#27272a', color: '#a1a1aa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      }
    >
      {isDemo && (
        <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 13, color: '#f59e0b', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={14} />
          Meta Ad Library ToS needs to be accepted at facebook.com/ads/library/api/ — showing demo data until synced
        </div>
      )}
      <MetaAdsContent campaigns={displayCampaigns} ads={DEMO_ADS} isDemo={isDemo} syncing={syncing} onSync={handleSync} />
    </PageShell>
  );
}

function MetaAdsContent({ campaigns, ads, isDemo, syncing, onSync }: { campaigns: any[]; ads: any[]; isDemo: boolean; syncing: boolean; onSync: () => void }) {
  const totalSpend = isDemo ? '$5,670' : campaigns.reduce((s: number, c: any) => s + parseFloat(String(c.spend || '').replace(/[$,]/g, '') || '0'), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const totalImpressions = isDemo ? '381,200' : campaigns.reduce((s: number, c: any) => s + parseInt(String(c.impressions || '0').replace(/,/g, '') || '0'), 0).toLocaleString();
  const totalClicks = isDemo ? '7,460' : campaigns.reduce((s: number, c: any) => s + parseInt(String(c.clicks || '0').replace(/,/g, '') || '0'), 0).toLocaleString();
  const avgRoas = '3.6x';

  return (
    <>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon={DollarSign} color="#7c3aed" label="Total Spend" value={totalSpend} sub="Last 30 days" />
        <StatCard icon={Eye} color="#3b82f6" label="Impressions" value={totalImpressions} sub="Across all campaigns" />
        <StatCard icon={MousePointer} color="#22c55e" label="Total Clicks" value={totalClicks} sub="All ad sets" />
        <StatCard icon={TrendingUp} color="#f59e0b" label="Avg ROAS" value={avgRoas} sub="Return on ad spend" />
      </div>

      {/* Campaigns Table */}
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 14, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f4f4f5' }}>Campaigns</h3>
            <p style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>{campaigns.length} active campaigns</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: 600 }}>
              {campaigns.filter((c: any) => (c.status || '').toUpperCase() === 'ACTIVE').length} Active
            </span>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 600 }}>
              {campaigns.filter((c: any) => (c.status || '').toUpperCase() === 'PAUSED').length} Paused
            </span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#1c1c1f' }}>
                {['Campaign', 'Status', 'Budget', 'Spend', 'Impressions', 'Clicks', 'CTR', 'CPC', 'ROAS'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c: any, i: number) => (
                <tr key={i} style={{ borderTop: '1px solid #27272a' }}>
                  <td style={{ padding: '12px 14px', color: '#f4f4f5', fontWeight: 600, maxWidth: 220 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}><StatusBadge status={c.status} /></td>
                  <td style={{ padding: '12px 14px', color: '#a1a1aa' }}>{c.budget}</td>
                  <td style={{ padding: '12px 14px', color: '#f4f4f5', fontWeight: 600 }}>{c.spend}</td>
                  <td style={{ padding: '12px 14px', color: '#a1a1aa' }}>{c.impressions}</td>
                  <td style={{ padding: '12px 14px', color: '#a1a1aa' }}>{c.clicks}</td>
                  <td style={{ padding: '12px 14px', color: '#22c55e', fontWeight: 600 }}>{c.ctr}</td>
                  <td style={{ padding: '12px 14px', color: '#a1a1aa' }}>{c.cpc}</td>
                  <td style={{ padding: '12px 14px', color: '#7c3aed', fontWeight: 700 }}>{c.roas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Ads + Audience */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Top Performing Ads */}
        <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #27272a' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f4f4f5' }}>Top Performing Ads</h3>
            <p style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>Ranked by ROAS</p>
          </div>
          <div style={{ padding: '8px 0' }}>
            {ads.map((ad: any, i: number) => (
              <div key={i} style={{ padding: '12px 22px', borderBottom: i < ads.length - 1 ? '1px solid #1c1c1f' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a' }}>{i + 1}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.name}</div>
                  <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>{ad.impressions} impressions · {ad.ctr} CTR</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', flexShrink: 0 }}>{ad.roas}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Audience Breakdown */}
        <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #27272a' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f4f4f5' }}>Audience Breakdown</h3>
            <p style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>By age & placement</p>
          </div>
          <div style={{ padding: '16px 22px' }}>
            <p style={{ fontSize: 12, color: '#52525b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Age Groups</p>
            {[
              { label: '25–34', pct: 38, color: '#7c3aed' },
              { label: '35–44', pct: 27, color: '#3b82f6' },
              { label: '18–24', pct: 18, color: '#22c55e' },
              { label: '45–54', pct: 12, color: '#f59e0b' },
              { label: '55+', pct: 5, color: '#6b7280' },
            ].map(a => (
              <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#a1a1aa', width: 40, flexShrink: 0 }}>{a.label}</span>
                <div style={{ flex: 1, backgroundColor: '#27272a', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                  <div style={{ width: `${a.pct}%`, height: '100%', backgroundColor: a.color, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#f4f4f5', width: 32, textAlign: 'right' }}>{a.pct}%</span>
              </div>
            ))}
            <p style={{ fontSize: 12, color: '#52525b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, marginTop: 18 }}>Placements</p>
            {[
              { label: 'Instagram Feed', pct: 44, color: '#ec4899' },
              { label: 'Facebook Feed', pct: 31, color: '#3b82f6' },
              { label: 'Instagram Stories', pct: 16, color: '#f59e0b' },
              { label: 'Audience Network', pct: 9, color: '#6b7280' },
            ].map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#a1a1aa', width: 130, flexShrink: 0 }}>{p.label}</span>
                <div style={{ flex: 1, backgroundColor: '#27272a', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                  <div style={{ width: `${p.pct}%`, height: '100%', backgroundColor: p.color, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#f4f4f5', width: 32, textAlign: 'right' }}>{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
