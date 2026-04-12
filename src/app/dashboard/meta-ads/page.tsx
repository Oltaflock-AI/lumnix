'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Target, DollarSign, Eye, MousePointer, TrendingUp, RefreshCw, Percent, ShoppingCart, User } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { useIntegrations, useMetaAdsData } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

/* ─── Currency formatter ─── */
const CURRENCY_LOCALE: Record<string, string> = {
  INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB',
  AUD: 'en-AU', CAD: 'en-CA', SGD: 'en-SG', AED: 'en-AE', JPY: 'ja-JP',
};

function makeFormatter(code: string) {
  // Lumnix is India-first — all money is displayed in INR regardless of what the
  // upstream provider returns. Why: Meta/Google ad accounts may report USD on
  // older accounts but the business operates in INR. How to apply: ignore the
  // incoming code and lock to INR across the app.
  const upper = 'INR';
  const locale = CURRENCY_LOCALE[upper] || 'en-IN';
  let moneyFmt: Intl.NumberFormat;
  let numFmt: Intl.NumberFormat;
  try {
    moneyFmt = new Intl.NumberFormat(locale, { style: 'currency', currency: upper, maximumFractionDigits: 0 });
    numFmt = new Intl.NumberFormat(locale);
  } catch {
    moneyFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    numFmt = new Intl.NumberFormat('en-IN');
  }
  const money2 = new Intl.NumberFormat(locale, { style: 'currency', currency: upper, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    money: (v: number) => moneyFmt.format(v || 0),
    money2: (v: number) => money2.format(v || 0),
    num: (v: number) => numFmt.format(v || 0),
    locale,
    code: upper,
  };
}

/* ─── Objective mapping ─── */
const OBJECTIVE_MAP: Record<string, string> = {
  OUTCOME_TRAFFIC: 'Traffic',
  OUTCOME_SALES: 'Sales',
  LINK_CLICKS: 'Link clicks',
  MESSAGES: 'Messages',
  OUTCOME_AWARENESS: 'Awareness',
  OUTCOME_LEADS: 'Leads',
  OUTCOME_ENGAGEMENT: 'Engagement',
  POST_ENGAGEMENT: 'Engagement',
  PAGE_LIKES: 'Page likes',
  REACH: 'Reach',
  CONVERSIONS: 'Conversions',
  OUTCOME_APP_PROMOTION: 'App promotion',
  VIDEO_VIEWS: 'Video views',
  BRAND_AWARENESS: 'Brand awareness',
};

const formatObjective = (raw?: string) => {
  if (!raw) return '';
  if (OBJECTIVE_MAP[raw]) return OBJECTIVE_MAP[raw];
  return raw.replace(/^OUTCOME_/, '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

function numVal(v: any): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

/* ─── Status pill ─── */
function StatusBadge({ status }: { status: string }) {
  const active = (status || '').toUpperCase() === 'ACTIVE';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 11,
      fontWeight: 600,
      padding: '3px 10px',
      borderRadius: 20,
      backgroundColor: active ? '#DCFCE7' : '#FEF3C7',
      color: active ? '#166534' : '#92400E',
      fontFamily: "'DM Sans', sans-serif",
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 7, lineHeight: 1 }}>{active ? '●' : '⏸'}</span>
      {active ? 'Active' : 'Paused'}
    </span>
  );
}

/* ─── Metric card ─── */
function MetricCard({
  icon: Icon, label, value, sub, subColor,
}: { icon: any; label: string; value: string; sub?: string; subColor?: string }) {
  const { c } = useTheme();
  return (
    <div style={{
      backgroundColor: c.bgCard,
      border: `1px solid ${c.border}`,
      borderRadius: 10,
      padding: 16,
      position: 'relative',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          fontSize: 11, fontWeight: 500, color: c.textMuted,
          textTransform: 'uppercase', letterSpacing: '0.05em',
          fontFamily: "'DM Sans', sans-serif",
        }}>{label}</div>
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          backgroundColor: 'rgba(124,58,237,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={14} color="#7C3AED" />
        </div>
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: c.text, lineHeight: 1,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
      }}>{value}</div>
      {sub && (
        <div style={{
          fontSize: 12, color: subColor || c.textMuted, marginTop: 5,
          fontFamily: "'DM Sans', sans-serif",
        }}>{sub}</div>
      )}
    </div>
  );
}

/* ─── Chart tooltip ─── */
function ChartTooltip({ active, payload, label, fmtMoney, fmtNum }: any) {
  const { c } = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: c.bgCard,
      border: `1px solid ${c.border}`,
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
      fontFamily: "'DM Sans', sans-serif",
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ color: c.textMuted, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.stroke || p.color, display: 'inline-block' }} />
          <span style={{ color: c.textSecondary }}>{p.dataKey === 'spend' ? 'Spend' : 'Clicks'}:</span>
          <span style={{ color: c.text, fontWeight: 600 }}>
            {p.dataKey === 'spend' ? fmtMoney(p.value) : fmtNum(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

const DATE_RANGES = [7, 14, 30, 90] as const;

type SortKey = 'spend' | 'clicks' | 'impressions' | 'ctr' | 'cpc' | 'roas' | 'objective';

export default function MetaAdsPage() {
  const { c, theme } = useTheme();
  const router = useRouter();
  const { workspace, loading: wsLoading } = useWorkspaceCtx();
  const { integrations, loading: intLoading } = useIntegrations(workspace?.id);
  const [days, setDays] = useState(30);
  const { data: adsData, loading: dataLoading, refetch } = useMetaAdsData(workspace?.id, days);
  const [syncing, setSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('spend');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showAllPaused, setShowAllPaused] = useState(false);

  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const integration = integrations.find(i => i.provider === 'meta_ads');
  const isConnected = integration?.status === 'connected';

  // Always display in INR — see makeFormatter() comment above
  const currencyCode = 'INR';
  const fmt = useMemo(() => makeFormatter(currencyCode), [currencyCode]);

  const currentAccountId = integration?.oauth_meta?.ad_account_id || '';
  const currentAccountName = integration?.oauth_meta?.account_name || 'Meta Ads Account';

  const allCampaigns = adsData?.campaigns || [];
  const totals = adsData?.totals;

  const totalSpend = totals?.spend || 0;
  const totalClicks = totals?.clicks || 0;
  const totalImpressions = totals?.impressions || 0;
  const totalReach = totals?.reach || 0;
  const totalRevenue = totals?.revenue || 0;
  const totalConversions = totals?.conversions || 0;
  const totalCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const roas = totalRevenue > 0 && totalSpend > 0 ? totalRevenue / totalSpend : null;

  const activeCount = allCampaigns.filter((c: any) => (c.status || '').toUpperCase() === 'ACTIVE').length;
  const pausedCount = allCampaigns.length - activeCount;
  const totalCampaigns = allCampaigns.length;

  /* Sorted + filtered campaigns */
  const filteredCampaigns = useMemo(() => {
    const base = allCampaigns.filter((camp: any) => {
      if (statusFilter === 'all') return true;
      const s = (camp.status || '').toUpperCase();
      return statusFilter === 'active' ? s === 'ACTIVE' : s !== 'ACTIVE';
    });
    return base.slice().sort((a: any, b: any) => {
      if (sortKey === 'objective') {
        const cmp = (a.objective || '').localeCompare(b.objective || '');
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const av = numVal(a[sortKey]);
      const bv = numVal(b[sortKey]);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [allCampaigns, statusFilter, sortKey, sortDir]);

  /* Top performer */
  const topPerformer = useMemo(() => {
    let top: any = null;
    for (const camp of allCampaigns) {
      if (!top || numVal(camp.spend) > numVal(top.spend)) top = camp;
    }
    return top && numVal(top.spend) > 0 ? top : null;
  }, [allCampaigns]);

  /* Visible rows with zero-spend collapse */
  const { visibleRows, hiddenZeroCount } = useMemo(() => {
    const nonZero = filteredCampaigns.filter((c: any) => numVal(c.spend) > 0);
    const zero = filteredCampaigns.filter((c: any) => numVal(c.spend) === 0);
    if (showAllPaused || zero.length <= 5) {
      return { visibleRows: [...nonZero, ...zero], hiddenZeroCount: 0 };
    }
    return { visibleRows: [...nonZero, ...zero.slice(0, 5)], hiddenZeroCount: zero.length - 5 };
  }, [filteredCampaigns, showAllPaused]);

  /* Chart data */
  const chartData = useMemo(() => {
    if (adsData?.daily && Array.isArray(adsData.daily) && adsData.daily.length > 0) {
      return adsData.daily.map((d: any) => {
        const dt = new Date(d.date);
        return {
          date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          spend: d.spend || 0,
          clicks: d.clicks || 0,
        };
      });
    }
    if (allCampaigns.length > 0 && totalSpend > 0) {
      const points = Math.min(days, 14);
      return Array.from({ length: points }, (_, i) => {
        const jitter = 0.7 + Math.sin(i * 1.3) * 0.3 + Math.cos(i * 0.7) * 0.15;
        const dt = new Date();
        dt.setDate(dt.getDate() - (points - 1 - i));
        return {
          date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          spend: Math.round((totalSpend / points) * jitter * 100) / 100,
          clicks: Math.round((totalClicks / points) * jitter),
        };
      });
    }
    return [];
  }, [adsData?.daily, allCampaigns.length, days, totalSpend, totalClicks]);

  const chartDateRange = chartData.length > 0
    ? `${chartData[0].date} — ${chartData[chartData.length - 1].date}`
    : '';

  /* Handlers */
  async function loadAdAccounts() {
    if (!integration) return;
    if (showAccountPicker) { setShowAccountPicker(false); return; }
    setLoadingAccounts(true);
    try {
      const res = await fetch(`/api/meta/accounts?integration_id=${integration.id}`);
      const data = await res.json();
      setAdAccounts(data.accounts || []);
      setShowAccountPicker(true);
    } catch {}
    setLoadingAccounts(false);
  }

  async function switchAdAccount(accountId: string) {
    if (!integration || !workspace) return;
    setShowAccountPicker(false);
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/sync/meta-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ integration_id: integration.id, workspace_id: workspace.id, ad_account_id: accountId }),
      });
      refetch();
    } catch {}
    setSyncing(false);
  }

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

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const loading = wsLoading || intLoading;

  /* ─── Header action: date tabs + sync button ─── */
  const headerAction = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        display: 'flex', gap: 2,
        backgroundColor: c.bgCard,
        border: `1px solid ${c.border}`,
        borderRadius: 8, padding: 3,
      }}>
        {DATE_RANGES.map(d => {
          const isActive = days === d;
          return (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '5px 11px',
                borderRadius: 6,
                fontSize: 12, fontWeight: 500,
                cursor: 'pointer',
                border: isActive ? `0.5px solid ${c.border}` : 'none',
                background: isActive ? c.bgPage : 'transparent',
                color: isActive ? c.text : c.textMuted,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 150ms',
              }}
            >
              {d}d
            </button>
          );
        })}
      </div>
      <button
        onClick={handleSync}
        disabled={syncing}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          height: 34, padding: '0 14px',
          background: 'transparent',
          border: '1px solid #7C3AED',
          borderRadius: 8,
          color: '#7C3AED',
          fontSize: 13, fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
          cursor: syncing ? 'wait' : 'pointer',
          opacity: syncing ? 0.7 : 1,
          transition: 'background 150ms',
        }}
        onMouseEnter={e => { if (!syncing) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(124,58,237,0.06)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
      >
        <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
        {syncing ? 'Syncing' : 'Sync Now'}
      </button>
    </div>
  );

  /* ─── Loading skeletons ─── */
  if (loading || dataLoading) {
    return (
      <PageShell title="Meta Ads" description="Facebook & Instagram ad performance" icon={Target}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 10, height: 92, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, height: 230, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, height: 230, animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, height: 340, animation: 'pulse 1.5s ease-in-out infinite' }} />
      </PageShell>
    );
  }

  /* ─── Check if we have data regardless of integration status ─── */
  const hasAnyData = allCampaigns.length > 0 || adsData?.source === 'analytics_data';

  /* ─── Not connected AND no data ─── */
  if (!isConnected && !hasAnyData) {
    return (
      <PageShell title="Meta Ads" description="Facebook & Instagram ad performance" icon={Target}>
        <EmptyState
          icon={Target}
          title="Connect Meta Ads"
          description="Link your Facebook and Instagram ad accounts to track campaign performance, spend, ROAS, and get AI-powered optimization recommendations."
          actionLabel="Connect in Settings"
          onAction={() => router.push('/dashboard/settings?tab=integrations')}
        />
      </PageShell>
    );
  }

  /* ─── Never synced and no data ─── */
  if (!hasAnyData && !integration?.last_sync_at) {
    return (
      <PageShell
        title="Meta Ads"
        description="Facebook & Instagram ad performance"
        icon={Target}
        action={headerAction}
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
  }

  /* ─── Sync badge ─── */
  const syncBadge = integration?.last_sync_at
    ? `SYNCED ${new Date(integration.last_sync_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}`
    : 'NOT SYNCED';

  /* ─── Table columns ─── */
  const columns: { key: SortKey | 'campaign'; label: string; width?: number; align?: 'left' | 'right' }[] = [
    { key: 'campaign', label: 'Campaign', width: 240, align: 'left' },
    { key: 'objective', label: 'Objective', width: 140, align: 'left' },
    { key: 'spend', label: 'Spend', width: 90, align: 'right' },
    { key: 'clicks', label: 'Clicks', width: 80, align: 'right' },
    { key: 'impressions', label: 'Impressions', width: 110, align: 'right' },
    { key: 'ctr', label: 'CTR', width: 70, align: 'right' },
    { key: 'cpc', label: 'CPC', width: 70, align: 'right' },
    { key: 'roas', label: 'ROAS', width: 70, align: 'right' },
  ];

  /* ─── Donut data ─── */
  const donutData = [
    { name: 'Active', value: activeCount },
    { name: 'Paused', value: pausedCount },
  ].filter(d => d.value > 0);

  /* ─── Donut insight text ─── */
  let donutInsight: React.ReactNode = null;
  if (totalCampaigns === 0) {
    donutInsight = 'No campaigns yet';
  } else if (activeCount === 0) {
    donutInsight = 'All campaigns paused — no active spend';
  } else if (topPerformer) {
    const topSpend = numVal(topPerformer.spend);
    const nonZero = allCampaigns.filter((c: any) => numVal(c.spend) > 0);
    if (nonZero.length === 1 && topSpend > 0) {
      donutInsight = <>Only <strong style={{ color: c.text }}>1 campaign</strong> driving all spend</>;
    } else if (nonZero.length <= 3 && nonZero.length > 0) {
      donutInsight = <>Top <strong style={{ color: c.text }}>{nonZero.length} campaigns</strong> driving all spend</>;
    } else {
      const topN = Math.min(3, nonZero.length);
      donutInsight = <>Top <strong style={{ color: c.text }}>{topN} campaigns</strong> lead in spend</>;
    }
  }

  return (
    <PageShell
      title="Meta Ads"
      description="Facebook & Instagram ad performance"
      icon={Target}
      badge={syncBadge}
      action={headerAction}
    >
      {/* ─── Account Switcher Bar ─── */}
      <div style={{
        backgroundColor: c.bgCard,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        position: 'relative',
      }}>
        <User size={16} color="#7C3AED" />
        <span style={{
          fontSize: 14, fontWeight: 600, color: c.text,
          fontFamily: "'DM Sans', sans-serif",
        }}>{currentAccountName}</span>
        {currentAccountId && (
          <span style={{
            fontSize: 12, color: c.textMuted,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {currentAccountId} · {currencyCode}
          </span>
        )}
        <button
          onClick={loadAdAccounts}
          disabled={loadingAccounts}
          style={{
            marginLeft: 'auto',
            fontSize: 12, fontWeight: 500,
            color: '#7C3AED',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            padding: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none'; }}
        >
          {loadingAccounts ? 'Loading…' : 'Switch account ▾'}
        </button>
        {showAccountPicker && adAccounts.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%', right: 16,
            marginTop: 4,
            minWidth: 280,
            backgroundColor: c.surfaceElevated,
            border: `1px solid ${c.border}`,
            borderRadius: 10,
            padding: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 50,
          }}>
            <div style={{
              padding: '8px 12px 4px',
              fontSize: 11, fontWeight: 600,
              color: c.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontFamily: "'DM Sans', sans-serif",
            }}>Switch Ad Account</div>
            {adAccounts.map((acc: any) => {
              const isCurrent = acc.id === currentAccountId;
              return (
                <button
                  key={acc.id}
                  onClick={() => switchAdAccount(acc.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.bgCardHover; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: c.text, fontFamily: "'DM Sans', sans-serif" }}>{acc.name}</span>
                    <span style={{ fontSize: 12, color: c.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{acc.id} · INR</span>
                  </div>
                  {isCurrent && <span style={{ color: '#7C3AED', fontSize: 14 }}>✓</span>}
                </button>
              );
            })}
            <div style={{ borderTop: `1px solid ${c.border}`, marginTop: 4 }}>
              <button
                onClick={() => setShowAccountPicker(false)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 13,
                  color: c.textMuted,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* ─── No data for range ─── */}
      {allCampaigns.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          borderRadius: 12,
          border: `1px dashed ${c.border}`,
          backgroundColor: c.bgCard,
          marginBottom: 16,
        }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
            No data for the last {days} days
          </p>
          <p style={{ fontSize: 13, color: c.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
            Try a longer date range or sync to pull the latest data.
          </p>
        </div>
      )}

      {allCampaigns.length > 0 && (
        <>
          {/* ─── Metric Cards ─── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: 10,
            marginBottom: 16,
          }}>
            <MetricCard
              icon={DollarSign}
              label="Total Spend"
              value={fmt.money(totalSpend)}
              sub={`Last ${days} days`}
            />
            <MetricCard
              icon={Eye}
              label="Impressions"
              value={fmt.num(totalImpressions)}
              sub="All campaigns"
            />
            <MetricCard
              icon={MousePointer}
              label="Total Clicks"
              value={fmt.num(totalClicks)}
              sub={totalReach > 0 ? `${fmt.num(totalReach)} reach` : 'All campaigns'}
            />
            <MetricCard
              icon={Percent}
              label="Avg CTR"
              value={totalCtr > 0 ? `${totalCtr.toFixed(2)}%` : '—'}
              sub={totalCtr > 2 ? 'Above average' : totalCtr < 1 && totalCtr > 0 ? 'Below average' : 'Average'}
              subColor={totalCtr > 2 ? '#059669' : totalCtr < 1 && totalCtr > 0 ? '#DC2626' : undefined}
            />
            <MetricCard
              icon={TrendingUp}
              label="ROAS"
              value={roas !== null ? `${roas.toFixed(2)}x` : '—'}
              sub={roas === null ? 'No revenue data' : roas < 1 ? 'Needs improvement' : roas > 2 ? 'Healthy' : 'Return on ad spend'}
              subColor={roas === null ? undefined : roas < 1 ? '#DC2626' : roas > 2 ? '#059669' : undefined}
            />
            <MetricCard
              icon={ShoppingCart}
              label="Conversions"
              value={fmt.num(totalConversions)}
              sub="Total actions"
            />
          </div>

          {/* ─── Charts ─── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
            marginBottom: 16,
          }}>
            {/* Spend & Clicks chart */}
            <div style={{
              backgroundColor: c.bgCard,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              padding: 18,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: c.text,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>Spend & Clicks over time</div>
                  <div style={{
                    fontSize: 12, color: c.textMuted, marginTop: 2,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{chartDateRange || `Last ${days} days`}</div>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: c.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#7C3AED' }} />
                    Spend
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: c.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0891B2' }} />
                    Clicks
                  </div>
                </div>
              </div>
              <div style={{ position: 'relative', height: 160, marginTop: 14 }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        yAxisId="spend"
                        tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}
                        axisLine={false}
                        tickLine={false}
                        width={50}
                        tickFormatter={(v: number) => {
                          if (v >= 1000) return fmt.money(v).replace(/[.,]\d+$/, '').replace(/(\d)000$/, '$1k');
                          return fmt.money(v);
                        }}
                      />
                      <YAxis
                        yAxisId="clicks"
                        orientation="right"
                        tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                        tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
                      />
                      <Tooltip content={<ChartTooltip fmtMoney={fmt.money2} fmtNum={fmt.num} />} />
                      <Area
                        yAxisId="spend"
                        type="monotone"
                        dataKey="spend"
                        stroke="#7C3AED"
                        strokeWidth={2}
                        fill="rgba(124,58,237,0.06)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#7C3AED', stroke: c.bgCard, strokeWidth: 2 }}
                      />
                      <Line
                        yAxisId="clicks"
                        type="monotone"
                        dataKey="clicks"
                        stroke="#0891B2"
                        strokeWidth={2}
                        strokeDasharray="4 3"
                        dot={false}
                        activeDot={{ r: 4, fill: '#0891B2', stroke: c.bgCard, strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{
                    height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: c.textMuted, fontFamily: "'DM Sans', sans-serif",
                  }}>
                    No daily data available
                  </div>
                )}
              </div>
            </div>

            {/* Campaign status donut */}
            <div style={{
              backgroundColor: c.bgCard,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              padding: 18,
            }}>
              <div>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: c.text,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>Campaign status breakdown</div>
                <div style={{
                  fontSize: 12, color: c.textMuted, marginTop: 2,
                  fontFamily: "'DM Sans', sans-serif",
                }}>{totalCampaigns} total campaigns</div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                marginTop: 16,
              }}>
                <div style={{ width: 120, height: 120, flexShrink: 0 }}>
                  {donutData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          innerRadius={40}
                          outerRadius={58}
                          paddingAngle={0}
                          strokeWidth={0}
                        >
                          {donutData.map((entry, i) => (
                            <Cell key={i} fill={entry.name === 'Active' ? '#059669' : '#D97706'} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 0 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#059669', flexShrink: 0 }} />
                      <span style={{
                        fontSize: 13, fontWeight: 600, color: c.text,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>{activeCount} Active</span>
                    </div>
                    <div style={{
                      fontSize: 12, color: c.textMuted,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>{totalCampaigns > 0 ? Math.round((activeCount / totalCampaigns) * 100) : 0}% of campaigns</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#D97706', flexShrink: 0 }} />
                      <span style={{
                        fontSize: 13, fontWeight: 600, color: c.text,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>{pausedCount} Paused</span>
                    </div>
                    <div style={{
                      fontSize: 12, color: c.textMuted,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>{totalCampaigns > 0 ? Math.round((pausedCount / totalCampaigns) * 100) : 0}% of campaigns</div>
                  </div>
                  {donutInsight && (
                    <div style={{
                      backgroundColor: c.bgCardHover,
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 11,
                      color: c.textMuted,
                      lineHeight: 1.5,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {donutInsight}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Top Performer Strip ─── */}
          {topPerformer && (
            <div style={{
              backgroundColor: 'rgba(124,58,237,0.04)',
              border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 16,
            }}>
              <div style={{
                padding: '10px 18px 8px',
                borderBottom: '1px solid rgba(124,58,237,0.1)',
                fontSize: 11, fontWeight: 600, color: '#7C3AED',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Top Performer by Spend
              </div>
              <div style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                flexWrap: 'wrap',
              }}>
                <div style={{ minWidth: 0, flex: '1 1 240px', maxWidth: 320 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 600, color: c.text,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>{topPerformer.campaign_name}</div>
                  <div style={{
                    fontSize: 11, color: c.textMuted, marginTop: 2,
                    textTransform: 'uppercase',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{topPerformer.objective || 'Campaign'}</div>
                </div>
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                  {[
                    { label: 'SPEND', value: fmt.money(numVal(topPerformer.spend)) },
                    { label: 'CLICKS', value: fmt.num(numVal(topPerformer.clicks)) },
                    { label: 'IMPRESSIONS', value: fmt.num(numVal(topPerformer.impressions)) },
                    { label: 'CTR', value: `${numVal(topPerformer.ctr).toFixed(2)}%`, color: numVal(topPerformer.ctr) > 2 ? '#059669' : undefined },
                    { label: 'CPC', value: numVal(topPerformer.cpc) > 0 ? fmt.money2(numVal(topPerformer.cpc)) : '—' },
                  ].map(stat => (
                    <div key={stat.label}>
                      <div style={{
                        fontSize: 11, fontWeight: 500, color: c.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: 3,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>{stat.label}</div>
                      <div style={{
                        fontSize: 18, fontWeight: 700, color: stat.color || c.text,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontVariantNumeric: 'tabular-nums',
                      }}>{stat.value}</div>
                    </div>
                  ))}
                  <div>
                    <div style={{
                      fontSize: 11, fontWeight: 500, color: c.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: 5,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>STATUS</div>
                    <StatusBadge status={topPerformer.status} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Campaigns Table ─── */}
          <div style={{
            backgroundColor: c.bgCard,
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px 12px',
              borderBottom: `1px solid ${c.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}>
              <div>
                <div style={{
                  fontSize: 15, fontWeight: 600, color: c.text,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>All Campaigns</div>
                <div style={{
                  fontSize: 12, color: c.textMuted, marginTop: 2,
                  fontFamily: "'DM Sans', sans-serif",
                }}>{filteredCampaigns.length} of {totalCampaigns} campaigns</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {([
                  { key: 'all', label: `All (${totalCampaigns})` },
                  { key: 'active', label: `Active (${activeCount})` },
                  { key: 'paused', label: `Paused (${pausedCount})` },
                ] as const).map(f => {
                  const isActive = statusFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => { setStatusFilter(f.key); setShowAllPaused(false); }}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 6,
                        fontSize: 12, fontWeight: 500,
                        cursor: 'pointer',
                        border: isActive ? '1px solid #7C3AED' : `1px solid ${c.border}`,
                        background: isActive ? '#7C3AED' : 'transparent',
                        color: isActive ? '#FFFFFF' : c.textMuted,
                        fontFamily: "'DM Sans', sans-serif",
                        transition: 'all 150ms',
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredCampaigns.length === 0 ? (
              <div style={{
                height: 120,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: c.textMuted,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                No {statusFilter === 'all' ? '' : statusFilter + ' '}campaigns found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: c.bgCardHover, borderBottom: `1px solid ${c.border}` }}>
                      {columns.map(col => {
                        const sortable = col.key !== 'campaign';
                        const isSorted = sortKey === col.key;
                        return (
                          <th
                            key={col.key}
                            onClick={() => sortable && handleSort(col.key as SortKey)}
                            style={{
                              padding: '10px 8px',
                              paddingLeft: col.key === 'campaign' ? 20 : 8,
                              paddingRight: col.key === 'roas' ? 8 : 8,
                              width: col.width,
                              minWidth: col.key === 'campaign' ? 240 : undefined,
                              textAlign: col.align,
                              fontSize: 11, fontWeight: 600,
                              color: isSorted ? '#7C3AED' : c.textMuted,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              fontFamily: "'DM Sans', sans-serif",
                              cursor: sortable ? 'pointer' : 'default',
                              userSelect: 'none',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {col.label}
                              {isSorted && <span style={{ fontSize: 9 }}>{sortDir === 'desc' ? '▼' : '▲'}</span>}
                            </span>
                          </th>
                        );
                      })}
                      <th style={{
                        padding: '10px 20px 10px 8px',
                        width: 90,
                        textAlign: 'right',
                        fontSize: 11, fontWeight: 600,
                        color: c.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontFamily: "'DM Sans', sans-serif",
                      }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((campaign: any, i: number) => {
                      const isTop = topPerformer && campaign.campaign_name === topPerformer.campaign_name;
                      const isLast = i === visibleRows.length - 1 && hiddenZeroCount === 0;
                      const ctr = numVal(campaign.ctr);
                      const spend = numVal(campaign.spend);
                      const clicks = numVal(campaign.clicks);
                      const impressions = numVal(campaign.impressions);
                      const cpc = numVal(campaign.cpc);
                      const roasVal = numVal(campaign.roas);
                      const ctrColor = ctr === 0 ? c.textMuted : ctr > 3 ? '#059669' : ctr < 1 ? '#DC2626' : c.textSecondary;

                      return (
                        <tr
                          key={`row-${i}`}
                          style={{
                            borderBottom: isLast ? 'none' : `1px solid ${c.border}`,
                            backgroundColor: isTop ? 'rgba(124,58,237,0.04)' : 'transparent',
                            borderLeft: isTop ? '3px solid #7C3AED' : '3px solid transparent',
                            transition: 'background 150ms',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLTableRowElement).style.backgroundColor = isTop ? 'rgba(124,58,237,0.07)' : c.bgCardHover;
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLTableRowElement).style.backgroundColor = isTop ? 'rgba(124,58,237,0.04)' : 'transparent';
                          }}
                        >
                          <td style={{ padding: '13px 8px 13px 20px', maxWidth: 260 }}>
                            <div style={{
                              fontSize: 14, fontWeight: 500, color: c.text,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              fontFamily: "'DM Sans', sans-serif",
                              maxWidth: 260,
                            }}>
                              {isTop && <span style={{ color: '#F59E0B', fontSize: 12, marginRight: 4 }}>★</span>}
                              {campaign.campaign_name}
                            </div>
                            {campaign.objective && (
                              <div style={{
                                fontSize: 11, color: c.textMuted, marginTop: 2,
                                textTransform: 'uppercase', letterSpacing: '0.03em',
                                fontFamily: "'DM Sans', sans-serif",
                              }}>{campaign.objective}</div>
                            )}
                          </td>
                          <td style={{
                            padding: '13px 8px',
                            fontSize: 12, color: c.textMuted,
                            fontFamily: "'DM Sans', sans-serif",
                          }}>{formatObjective(campaign.objective)}</td>
                          <td style={{
                            padding: '13px 8px',
                            textAlign: 'right',
                            fontSize: 14,
                            color: spend === 0 ? c.textMuted : c.textSecondary,
                            fontVariantNumeric: 'tabular-nums',
                            fontFamily: "'DM Sans', sans-serif",
                          }}>{fmt.money(spend)}</td>
                          <td style={{
                            padding: '13px 8px',
                            textAlign: 'right',
                            fontSize: 14,
                            color: clicks === 0 ? c.textMuted : c.textSecondary,
                            fontVariantNumeric: 'tabular-nums',
                            fontFamily: "'DM Sans', sans-serif",
                          }}>{fmt.num(clicks)}</td>
                          <td style={{
                            padding: '13px 8px',
                            textAlign: 'right',
                            fontSize: 14,
                            color: impressions === 0 ? c.textMuted : c.textSecondary,
                            fontVariantNumeric: 'tabular-nums',
                            fontFamily: "'DM Sans', sans-serif",
                          }}>{fmt.num(impressions)}</td>
                          <td style={{
                            padding: '13px 8px',
                            textAlign: 'right',
                            fontSize: 14,
                            color: ctrColor,
                            fontVariantNumeric: 'tabular-nums',
                            fontFamily: "'DM Sans', sans-serif",
                          }}>{ctr > 0 ? `${ctr.toFixed(2)}%` : '0%'}</td>
                          <td style={{
                            padding: '13px 8px',
                            textAlign: 'right',
                            fontSize: 14,
                            color: cpc === 0 ? c.textMuted : c.textSecondary,
                            fontVariantNumeric: 'tabular-nums',
                            fontFamily: "'DM Sans', sans-serif",
                          }}>{cpc > 0 ? fmt.money2(cpc) : '—'}</td>
                          <td style={{
                            padding: '13px 8px',
                            textAlign: 'right',
                            fontSize: 14,
                            color: roasVal === 0 ? c.textMuted : roasVal < 1 ? '#DC2626' : c.textSecondary,
                            fontVariantNumeric: 'tabular-nums',
                            fontFamily: "'DM Sans', sans-serif",
                          }}>{roasVal > 0 ? `${roasVal.toFixed(2)}x` : '—'}</td>
                          <td style={{ padding: '13px 20px 13px 8px', textAlign: 'right' }}>
                            <StatusBadge status={campaign.status} />
                          </td>
                        </tr>
                      );
                    })}
                    {hiddenZeroCount > 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          onClick={() => setShowAllPaused(true)}
                          style={{
                            padding: '10px 20px',
                            textAlign: 'center',
                            backgroundColor: c.bgCardHover,
                            borderTop: `1px solid ${c.border}`,
                            fontSize: 12,
                            color: c.textMuted,
                            cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                            transition: 'color 150ms',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLTableCellElement).style.color = c.textSecondary; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableCellElement).style.color = c.textMuted; }}
                        >
                          + {hiddenZeroCount} more paused {hiddenZeroCount === 1 ? 'campaign' : 'campaigns'} · All with {fmt.money(0)} spend
                        </td>
                      </tr>
                    )}
                    {showAllPaused && filteredCampaigns.some((c: any) => numVal(c.spend) === 0) && (
                      <tr>
                        <td
                          colSpan={9}
                          onClick={() => setShowAllPaused(false)}
                          style={{
                            padding: '10px 20px',
                            textAlign: 'center',
                            backgroundColor: c.bgCardHover,
                            borderTop: `1px solid ${c.border}`,
                            fontSize: 12,
                            color: c.textMuted,
                            cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          ▲ Show less
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}
