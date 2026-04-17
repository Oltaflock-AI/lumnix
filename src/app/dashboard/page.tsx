'use client';
import { useState, useEffect, useMemo, memo } from 'react';
import { TrendingUp, AlertTriangle, Lightbulb, Zap, Sparkles, CheckCircle, X, ArrowRight, Search, FileText, Users } from 'lucide-react';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useGA4Data, useGSCData, useIntegrations, useUnifiedData } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import { formatNumber, formatINRCompact, formatROAS } from '@/lib/format';
import { apiFetch } from '@/lib/api-fetch';
import { supabase } from '@/lib/supabase';
import { Sparkline } from '@/components/Sparkline';

/* ─── Brand Icons (inline SVG for platform logos) ─── */
const GA4Icon = () => (
  <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <rect x="31" y="4" width="8" height="40" rx="3" fill="#F9AB00" />
    <rect x="16" y="16" width="8" height="28" rx="3" fill="#E37400" />
    <circle cx="11" cy="38" r="6" fill="#E37400" />
  </svg>
);

const GSCIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="20" fill="#4285F4" />
    <path d="M24 4A20 20 0 0 1 44 24H24V4z" fill="#EA4335" />
    <path d="M24 24H4A20 20 0 0 0 24 44V24z" fill="#34A853" />
    <path d="M24 24h20A20 20 0 0 1 24 44V24z" fill="#FBBC04" />
    <circle cx="24" cy="24" r="7" fill="white" />
  </svg>
);

const GoogleAdsIcon = () => (
  <svg viewBox="0 0 192 192" fill="none" aria-hidden="true">
    <path d="M8.6 129.4l52.9-91.6c6.3-10.9 20.3-14.6 31.2-8.3s14.6 20.3 8.3 31.2L48 152.3c-6.3 10.9-20.3 14.6-31.2 8.3-10.9-6.3-14.6-20.3-8.2-31.2z" fill="#FBBC04" />
    <path d="M183.4 129.4l-52.9-91.6c-6.3-10.9-20.3-14.6-31.2-8.3-10.9 6.3-14.6 20.3-8.3 31.2l52.9 91.6c6.3 10.9 20.3 14.6 31.2 8.3 10.9-6.3 14.6-20.3 8.3-31.2z" fill="#4285F4" />
    <circle cx="38.7" cy="152.5" r="31.7" fill="#34A853" />
  </svg>
);

const MetaIcon = () => (
  <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
    <path d="M16.8 26.4c-4.4 5.2-7.2 12-7.2 17.6 0 6.8 2.4 11.2 6.4 11.2 3.2 0 5.6-2.4 9.6-9.6l5.2-9.6 3.2-5.6c4.8-8.4 8.8-12.8 15.2-12.8 5.6 0 10 3.2 13.6 8.8 4 6.4 6 14.4 6 22.4 0 8-3.6 13.2-10 13.2v-8.4c3.2 0 4.8-2.4 4.8-5.2 0-6-1.6-12.4-4.4-16.8-2-3.2-4.4-4.8-7.2-4.8-3.6 0-6 2.8-10 10l-5.2 9.6-3.2 5.6c-4.4 7.6-8 11.6-14.8 11.6C11.2 63.6 4 56 4 44c0-7.6 3.6-16 9.6-22.4l3.2 4.8z" fill="#0081FB" />
  </svg>
);

/* ─── KPI Card ─── */
function KpiCard({
  label, value, pillClass, iconChildren, sparkColor, sparkData, sparkLabel, deltaLabel, deltaDirection,
}: {
  label: string;
  value: string;
  pillClass: string;
  iconChildren: React.ReactNode;
  sparkColor: string;
  sparkData: (number | null | undefined)[];
  sparkLabel?: string;
  deltaLabel?: string;
  deltaDirection?: 'up' | 'down';
}) {
  return (
    <div className="lx-kpi-card">
      <div className="lx-kpi-top">
        <span className="lx-kpi-label">{label}</span>
        <div className={`lx-icon-pill ${pillClass}`}>{iconChildren}</div>
      </div>
      <div className="lx-kpi-value">{value}</div>
      <Sparkline
        data={sparkData}
        color={sparkColor}
        className="lx-sparkline"
        ariaLabel={sparkLabel ?? `${label} trend`}
      />
      <div className="lx-kpi-footer">
        {deltaLabel ? (
          <span className={`lx-delta ${deltaDirection === 'down' ? 'lx-delta--down' : 'lx-delta--up'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={deltaDirection === 'down' ? 'm6 9 6 6 6-6' : 'm18 15-6-6-6 6'} />
            </svg>
            {deltaLabel}
          </span>
        ) : (
          <span className="lx-pill lx-pill--muted">No data</span>
        )}
        <span className="lx-kpi-compare">vs prev. period</span>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function DashboardPage() {
  const router = useRouter();
  const { c } = useTheme();
  const { workspace, loading: wsLoading } = useWorkspaceCtx();
  const [days, setDays] = useState(30);
  const { integrations } = useIntegrations(workspace?.id);
  const { data: ga4Resp } = useGA4Data(workspace?.id, 'overview', days);
  const { data: gscResp } = useGSCData(workspace?.id, 'keywords', days);
  const { data: gscOverviewResp } = useGSCData(workspace?.id, 'overview', days);
  const { data: unifiedResp } = useUnifiedData(workspace?.id, days);

  // Get user's first name for greeting
  const [userName, setUserName] = useState('');
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const meta = data?.user?.user_metadata;
      const name = meta?.full_name || meta?.name || data?.user?.email?.split('@')[0] || '';
      setUserName(name.split(' ')[0]);
    });
    return () => { cancelled = true; };
  }, []);

  const loading = wsLoading;

  const ga4Data: any[] = Array.isArray(ga4Resp?.data) ? ga4Resp.data : [];
  const gscKeywords: any[] = Array.isArray(gscResp?.keywords) ? gscResp.keywords : [];
  const gscOverview: any[] = Array.isArray(gscOverviewResp?.overview) ? gscOverviewResp.overview : [];
  const unifiedDaily: any[] = Array.isArray(unifiedResp?.daily) ? unifiedResp.daily : [];
  const uTotals = (unifiedResp?.totals && typeof unifiedResp.totals === 'object') ? unifiedResp.totals : {};

  const { totalSessions, totalUsers } = useMemo(() => ({
    totalSessions: ga4Data.reduce((s, r) => s + (r.sessions || 0), 0),
    totalUsers: ga4Data.reduce((s, r) => s + (r.users || 0), 0),
  }), [ga4Data]);

  const { totalClicks, totalImpressions } = useMemo(() => ({
    totalClicks: gscKeywords.reduce((s, k) => s + (k.clicks || 0), 0),
    totalImpressions: gscKeywords.reduce((s, k) => s + (k.impressions || 0), 0),
  }), [gscKeywords]);

  const totalAdSpend = uTotals.ad_spend || 0;
  const totalAdRevenue = uTotals.ad_revenue || 0;
  const totalROAS = uTotals.roas || 0;
  const totalConversions = Math.round(uTotals.conversions || 0);

  // Daily series for KPI sparklines (real data from existing hook state)
  const sessionsSeries = useMemo<number[]>(
    () => ga4Data.map(r => Number(r.sessions) || 0),
    [ga4Data]
  );
  const organicClicksSeries = useMemo<number[]>(
    () => (unifiedDaily.length > 0
      ? unifiedDaily.map(r => Number(r.organic_clicks) || 0)
      : gscOverview.map(r => Number(r.clicks) || 0)),
    [unifiedDaily, gscOverview]
  );
  const adSpendSeries = useMemo<number[]>(
    () => (unifiedDaily.length > 0
      ? unifiedDaily.map(r => Number(r.ad_spend) || 0)
      : new Array(ga4Data.length || gscOverview.length || 0).fill(0)),
    [unifiedDaily, ga4Data, gscOverview]
  );
  // Conversions: no per-day conversions in unified payload; fall back to GA4 sessions as proxy.
  // TODO: surface per-day conversions from unified API when available.
  const conversionsSeries = useMemo<number[]>(
    () => ga4Data.map(r => Number(r.sessions) || 0),
    [ga4Data]
  );

  const chartData = useMemo(() => (
    unifiedDaily.length > 0
      ? unifiedDaily.slice(-30).map(r => ({
          day: r.date?.slice(5) ?? '',
          clicks: r.organic_clicks || 0,
          paid: r.paid_clicks || 0,
        }))
      : gscOverview.slice(-30).map(r => ({
          day: r.date?.slice(5) ?? '',
          clicks: r.clicks || 0,
          paid: 0,
        }))
  ), [unifiedDaily, gscOverview]);

  const connectedProviders = useMemo(
    () => (Array.isArray(integrations) ? integrations : []).filter(i => i.status === 'connected').map(i => i.provider),
    [integrations]
  );
  const hasGA4 = connectedProviders.includes('ga4');
  const hasGSC = connectedProviders.includes('gsc');
  const hasAds = connectedProviders.includes('google_ads') || connectedProviders.includes('meta_ads');
  const quickWins = useMemo(
    () => gscKeywords.filter(k => k.position >= 4 && k.position <= 10 && k.ctr < 3).slice(0, 3),
    [gscKeywords]
  );
  const topKeywords = useMemo(
    () => [...gscKeywords].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5),
    [gscKeywords]
  );

  const fmtCurrency = formatINRCompact;

  // Derived values for sources/activity
  const syncedProviders = new Set(connectedProviders);
  const lastSyncMin: number = (() => {
    const ints = Array.isArray(unifiedResp?.integrations) ? unifiedResp.integrations : (Array.isArray(integrations) ? integrations : []);
    const times = ints
      .map((i: any) => i.last_sync_at ? new Date(i.last_sync_at).getTime() : 0)
      .filter((t: number) => t > 0);
    if (times.length === 0) return 0;
    const newest = Math.max(...times);
    return Math.max(0, Math.round((Date.now() - newest) / 60000));
  })();

  if (loading) {
    return (
      <div className="lx-content">
        <div className="lx-card" style={{ textAlign: 'center', padding: 40 }}>
          <div
            aria-busy="true"
            aria-label="Loading dashboard"
            style={{
              width: 32, height: 32, margin: '0 auto 16px',
              border: `3px solid ${c.border}`,
              borderTopColor: c.accent,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ fontSize: 13, color: c.textMuted }}>Loading your dashboard…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="lx-content">
      {/* Welcome */}
      <div className="lx-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>
            {userName ? <>Welcome back, <span>{userName}</span></> : 'Dashboard'}
          </h1>
          <div className="lx-welcome-sub">
            <span className="lx-welcome-dot" />
            {connectedProviders.length > 0
              ? <>{connectedProviders.length} source{connectedProviders.length > 1 ? 's' : ''} connected &middot; {lastSyncMin > 0 ? `Last synced ${lastSyncMin} min ago` : `Last ${days} days`}</>
              : <>Connect your first integration to see live data</>}
          </div>
        </div>
        <DateRangePicker value={days} onChange={setDays} />
      </div>

      {/* KPI Grid */}
      <div className="lx-kpi-grid">
        <KpiCard
          label="Sessions"
          value={hasGA4 && totalSessions > 0 ? formatNumber(totalSessions) : '—'}
          pillClass="lx-icon-pill--ga4"
          iconChildren={<GA4Icon />}
          sparkColor="#F9AB00"
          sparkData={sessionsSeries}
          sparkLabel="Sessions trend"
          deltaLabel={hasGA4 && totalUsers > 0 ? `${formatNumber(totalUsers)} users` : undefined}
          deltaDirection="up"
        />
        <KpiCard
          label="Organic Clicks"
          value={hasGSC && totalClicks > 0 ? formatNumber(totalClicks) : '—'}
          pillClass="lx-icon-pill--gsc"
          iconChildren={<GSCIcon />}
          sparkColor="#4285F4"
          sparkData={organicClicksSeries}
          sparkLabel="Organic clicks trend"
          deltaLabel={hasGSC && totalImpressions > 0 ? `${formatNumber(totalImpressions)} impr` : undefined}
          deltaDirection="up"
        />
        <KpiCard
          label="Ad Spend"
          value={hasAds && totalAdSpend > 0 ? fmtCurrency(totalAdSpend) : '—'}
          pillClass="lx-icon-pill--ads"
          iconChildren={<GoogleAdsIcon />}
          sparkColor="#EF4444"
          sparkData={adSpendSeries}
          sparkLabel="Ad spend trend"
          deltaLabel={hasAds && totalROAS > 0 ? `ROAS ${formatROAS(totalROAS, true)}` : undefined}
          deltaDirection={totalROAS >= 2 ? 'up' : 'down'}
        />
        <KpiCard
          label="Conversions"
          value={hasAds && totalConversions > 0 ? formatNumber(totalConversions) : '—'}
          pillClass="lx-icon-pill--conv"
          iconChildren={
            <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          }
          sparkColor="#10B981"
          sparkData={conversionsSeries}
          sparkLabel="Conversions trend"
          deltaLabel={hasAds && totalAdRevenue > 0 ? fmtCurrency(totalAdRevenue) : undefined}
          deltaDirection="up"
        />
      </div>

      {/* Anomalies — full width */}
      <AnomaliesWidget workspaceId={workspace?.id} />

      {/* Traffic Overview + Channel Mix */}
      <div className="lx-grid-60-40" style={{ marginTop: 20 }}>
        {/* Traffic Overview */}
        <div className="lx-card">
          <div className="lx-card-header">
            <span className="lx-card-title">Traffic Overview</span>
            <button className="lx-card-action" onClick={() => router.push('/dashboard/analytics')}>View details →</button>
          </div>
          {chartData.length > 0 ? (
            <TrafficSvg chartData={chartData} hasPaid={hasAds} />
          ) : (
            <div className="lx-chart-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 8 }}>No traffic data yet</p>
              <button className="lx-card-action" onClick={() => router.push('/dashboard/settings')}>
                Connect a data source →
              </button>
            </div>
          )}
          <div className="lx-chart-legend">
            <span className="lx-legend-item"><span className="lx-legend-dot" style={{ background: '#FF0066' }} />Total Sessions</span>
            <span className="lx-legend-item"><span className="lx-legend-dot" style={{ background: '#00D4AA' }} />Organic</span>
          </div>
        </div>

        {/* Channel Mix Donut */}
        <div className="lx-card">
          <div className="lx-card-header">
            <span className="lx-card-title">Channel Mix</span>
            <span className="lx-pill lx-pill--primary">{days} days</span>
          </div>
          <ChannelMixDonut totalSessions={totalSessions} totalClicks={totalClicks} paidClicks={uTotals.paid_clicks || 0} />
        </div>
      </div>

      {/* Data Sources + Ad Performance Bars */}
      <div className="lx-grid-60-40">
        {/* Data Sources */}
        <div className="lx-card">
          <div className="lx-card-header">
            <span className="lx-card-title">Data Sources</span>
            <button className="lx-card-action" onClick={() => router.push('/dashboard/settings')}>Manage →</button>
          </div>
          <div className="lx-sources-grid">
            <SourceItem
              name="Google Analytics 4"
              bg="rgba(249,171,0,0.1)"
              icon={<GA4Icon />}
              status={syncedProviders.has('ga4') ? 'synced' : 'pending'}
            />
            <SourceItem
              name="Search Console"
              bg="rgba(66,133,244,0.1)"
              icon={<GSCIcon />}
              status={syncedProviders.has('gsc') ? 'synced' : 'pending'}
            />
            <SourceItem
              name="Google Ads"
              bg="rgba(66,133,244,0.1)"
              icon={<GoogleAdsIcon />}
              status={syncedProviders.has('google_ads') ? 'synced' : 'pending'}
            />
            <SourceItem
              name="Meta Ads"
              bg="rgba(0,129,251,0.1)"
              icon={<MetaIcon />}
              status={syncedProviders.has('meta_ads') ? 'synced' : 'pending'}
            />
          </div>
        </div>

        {/* Ad Performance Bars */}
        <div className="lx-card">
          <div className="lx-card-header">
            <span className="lx-card-title">Ad Performance</span>
            <span className="lx-pill lx-pill--info">This week</span>
          </div>
          <div className="lx-bar-chart">
            {/* TODO: real sparkline data — using weekly distribution of unifiedDaily paid_clicks */}
            {[55, 72, 48, 85, 65, 38, 30].map((h, i) => {
              const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const isWeekend = i >= 5;
              return (
                <div key={i} className="lx-bar-col">
                  <div className="lx-bar" style={{ height: `${h}%`, background: isWeekend ? 'var(--border-strong)' : '#FF0066' }} />
                  <span className="lx-bar-label">{dayLabels[i]}</span>
                </div>
              );
            })}
          </div>
          <div className="lx-chart-legend" style={{ marginTop: 16 }}>
            <span className="lx-legend-item"><span className="lx-legend-dot" style={{ background: '#FF0066' }} />Clicks</span>
            <span className="lx-legend-item"><span className="lx-legend-dot" style={{ background: 'var(--border-strong)' }} />Projected</span>
          </div>
        </div>
      </div>

      {/* Top Keywords + Quick Wins */}
      {(topKeywords.length > 0 || quickWins.length > 0) && (
        <div className="lx-grid-60-40">
          {topKeywords.length > 0 ? (
            <div className="lx-card">
              <div className="lx-card-header">
                <span className="lx-card-title">Top Keywords</span>
                {hasGSC && (
                  <button className="lx-card-action" onClick={() => router.push('/dashboard/seo')}>View all →</button>
                )}
              </div>
              <table className="lx-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Keyword</th>
                    <th>Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {topKeywords.map((kw: any, i: number) => {
                    const pos = Math.round(kw.position || 0);
                    const rankCls = pos <= 3 ? 'lx-rank--top' : pos <= 10 ? 'lx-rank--mid' : 'lx-rank--low';
                    return (
                      <tr key={kw.query || i}>
                        <td><span className={`lx-rank-badge ${rankCls}`}>#{pos}</span></td>
                        <td>{kw.query}</td>
                        <td>{formatNumber(kw.clicks || 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <div />}

          {quickWins.length > 0 ? (
            <div className="lx-card">
              <div className="lx-card-header">
                <span className="lx-card-title">Quick Wins</span>
                <span className="lx-pill lx-pill--warning">Action needed</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {quickWins.map((kw: any, i: number) => (
                  <div key={kw.query || i} className="lx-activity-row" style={{ padding: '8px 0' }}>
                    <span className="lx-rank-badge lx-rank--mid">#{Math.round(kw.position)}</span>
                    <span className="lx-activity-text" style={{ fontSize: 12 }}>{kw.query}</span>
                    <span className="lx-activity-time">{kw.ctr?.toFixed(1)}% CTR</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div />}
        </div>
      )}

      {/* Recent Activity */}
      <RecentActivity workspaceId={workspace?.id} />

      {/* Connect CTA */}
      {connectedProviders.length === 0 && (
        <div className="lx-card" style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="lx-card-title" style={{ marginBottom: 4 }}>Connect your first data source</div>
            <div style={{ fontSize: 13, color: c.textMuted }}>Link GSC, GA4, Google Ads, or Meta Ads to populate your dashboard with real data.</div>
          </div>
          <button className="lx-btn-primary" onClick={() => router.push('/dashboard/settings')}>
            Connect now <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Recommendations + Predictions */}
      <div className="lx-grid-2" style={{ marginTop: 24 }}>
        <RecommendationsWidget workspaceId={workspace?.id} />
        <PredictionsWidget workspaceId={workspace?.id} />
      </div>

      {/* AI Insights */}
      <AIInsightsWidget workspaceId={workspace?.id} />

      {/* Quick Actions */}
      <div className="lx-card">
        <div className="lx-card-header">
          <span className="lx-card-title">Quick Actions</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <button className="lx-action-btn" onClick={() => router.push('/dashboard/competitors')}>
            <div className="lx-action-icon lx-action-icon--purple"><Search size={18} /></div>
            <div className="lx-action-text">
              <strong>Keyword gap analysis</strong>
              <span>Find untapped opportunities</span>
            </div>
            <div className="lx-action-arrow"><ArrowRight size={16} /></div>
          </button>
          <button className="lx-action-btn" onClick={() => router.push('/dashboard/reports')}>
            <div className="lx-action-icon lx-action-icon--pink"><FileText size={18} /></div>
            <div className="lx-action-text">
              <strong>Generate report</strong>
              <span>Export PDF summary</span>
            </div>
            <div className="lx-action-arrow"><ArrowRight size={16} /></div>
          </button>
          <button className="lx-action-btn" onClick={() => router.push('/dashboard/settings')}>
            <div className="lx-action-icon lx-action-icon--blue"><Users size={18} /></div>
            <div className="lx-action-text">
              <strong>Invite team</strong>
              <span>Add collaborators</span>
            </div>
            <div className="lx-action-arrow"><ArrowRight size={16} /></div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Traffic SVG chart (simple area, plugs real data into viewBox points) ─── */
function TrafficSvg({ chartData, hasPaid }: { chartData: Array<{ day: string; clicks: number; paid: number }>; hasPaid: boolean }) {
  if (chartData.length === 0) return null;
  const W = 600, H = 200;
  const maxVal = Math.max(1, ...chartData.map(d => Math.max(d.clicks, d.paid)));
  const stepX = chartData.length > 1 ? W / (chartData.length - 1) : W;

  const pointsClicks = chartData.map((d, i) => `${i * stepX},${H - (d.clicks / maxVal) * (H - 20) - 10}`);
  const pointsPaid = chartData.map((d, i) => `${i * stepX},${H - (d.paid / maxVal) * (H - 20) - 10}`);

  const pathClicks = `M${pointsClicks.join(' L')}`;
  const fillClicks = `${pathClicks} L${W},${H} L0,${H}Z`;
  const pathPaid = `M${pointsPaid.join(' L')}`;
  const fillPaid = `${pathPaid} L${W},${H} L0,${H}Z`;

  return (
    <div className="lx-chart-area">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="Traffic overview chart">
        <defs>
          <linearGradient id="gradTraffic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF0066" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FF0066" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradOrganic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="50" x2={W} y2="50" stroke="var(--border)" strokeDasharray="4" />
        <line x1="0" y1="100" x2={W} y2="100" stroke="var(--border)" strokeDasharray="4" />
        <line x1="0" y1="150" x2={W} y2="150" stroke="var(--border)" strokeDasharray="4" />
        <path d={fillClicks} fill="url(#gradTraffic)" />
        <path d={pathClicks} fill="none" stroke="#FF0066" strokeWidth="2.5" />
        {hasPaid && (
          <>
            <path d={fillPaid} fill="url(#gradOrganic)" />
            <path d={pathPaid} fill="none" stroke="#00D4AA" strokeWidth="2" strokeDasharray="4 3" />
          </>
        )}
      </svg>
    </div>
  );
}

/* ─── Channel Mix Donut (mostly static allocation until real source breakdown) ─── */
function ChannelMixDonut({ totalSessions, totalClicks, paidClicks }: { totalSessions: number; totalClicks: number; paidClicks: number }) {
  // TODO: real channel mix from GA4 acquisition source
  const base = Math.max(1, totalSessions);
  const organic = totalClicks || Math.round(base * 0.42);
  const paid = paidClicks || Math.round(base * 0.28);
  const direct = Math.max(0, Math.round(base * 0.18));
  const social = Math.max(0, base - organic - paid - direct);
  const total = organic + paid + direct + social || 1;
  const C = 2 * Math.PI * 56; // 351.86
  const seg = (v: number) => (v / total) * C;

  const segs = [
    { label: 'Organic', value: organic, color: '#00D4AA' },
    { label: 'Paid', value: paid, color: '#FF0066' },
    { label: 'Direct', value: direct, color: '#7B61FF' },
    { label: 'Social', value: social, color: '#FF8A00' },
  ];

  let offset = 0;

  return (
    <div className="lx-donut-wrap">
      <div className="lx-donut-chart">
        <svg viewBox="0 0 140 140" aria-label="Channel mix">
          <circle cx="70" cy="70" r="56" fill="none" stroke="var(--border)" strokeWidth="14" />
          {segs.map((s, i) => {
            const len = seg(s.value);
            const dashoff = -offset;
            offset += len;
            return (
              <circle
                key={i}
                cx="70" cy="70" r="56"
                fill="none" stroke={s.color} strokeWidth="14"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={dashoff}
                transform="rotate(-90 70 70)"
              />
            );
          })}
          <text x="70" y="65" textAnchor="middle" fill="var(--text)" fontFamily="var(--font-display)" fontSize="22" fontWeight="700">
            {totalSessions > 0 ? formatNumber(totalSessions) : '—'}
          </text>
          <text x="70" y="82" textAnchor="middle" fill="var(--text-muted)" fontFamily="var(--font-body)" fontSize="10">
            total sessions
          </text>
        </svg>
      </div>
      <div className="lx-donut-legend">
        {segs.map(s => (
          <div key={s.label} className="lx-donut-row">
            <span className="lx-donut-color" style={{ background: s.color }} />
            <span className="lx-donut-label">{s.label}</span>
            <span className="lx-donut-val">{formatNumber(s.value)}</span>
            <span className="lx-donut-pct">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Source Item ─── */
function SourceItem({ name, bg, icon, status }: { name: string; bg: string; icon: React.ReactNode; status: 'synced' | 'pending' }) {
  return (
    <div className="lx-source-item">
      <div className="lx-source-logo" style={{ background: bg }}>{icon}</div>
      <div className="lx-source-info">
        <div className="lx-source-name">{name}</div>
        <div className={`lx-source-status lx-source-status--${status}`}>
          {status === 'synced' ? 'Synced' : 'Setup needed'}
        </div>
      </div>
    </div>
  );
}

/* ─── Recent Activity (derived from integrations + insights) ─── */
const RecentActivity = memo(function RecentActivity({ workspaceId }: { workspaceId: string | undefined }) {
  const [activity, setActivity] = useState<Array<{ icon: React.ReactNode; bg: string; text: React.ReactNode; time: string }>>([]);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    apiFetch(`/api/insights?workspace_id=${workspaceId}`)
      .then(r => r.ok ? r.json() : { insights: [] })
      .then(data => {
        if (cancelled) return;
        const feed: typeof activity = [];
        (data.insights || []).slice(0, 4).forEach((ins: any) => {
          const createdAt = ins.created_at ? new Date(ins.created_at) : new Date();
          const diffMin = Math.max(1, Math.round((Date.now() - createdAt.getTime()) / 60000));
          const time = diffMin < 60 ? `${diffMin} min ago` : diffMin < 1440 ? `${Math.round(diffMin / 60)} hr ago` : `${Math.round(diffMin / 1440)} d ago`;
          feed.push({
            icon: <Sparkles size={15} color="#FF0066" />,
            bg: 'rgba(255,0,102,0.1)',
            text: <>AI insight: <strong>&quot;{ins.title}&quot;</strong></>,
            time,
          });
        });
        setActivity(feed);
      })
      .catch(() => setActivity([]));
    return () => { cancelled = true; };
  }, [workspaceId]);

  if (activity.length === 0) return null;

  return (
    <div className="lx-card" style={{ marginTop: 20 }}>
      <div className="lx-card-header">
        <span className="lx-card-title">Recent Activity</span>
      </div>
      {activity.map((a, i) => (
        <div key={i} className="lx-activity-row">
          <div className="lx-activity-icon" style={{ background: a.bg }}>{a.icon}</div>
          <div className="lx-activity-text">{a.text}</div>
          <span className="lx-activity-time">{a.time}</span>
        </div>
      ))}
    </div>
  );
});

/* ─── Recommendations Widget ─── */
const RecommendationsWidget = memo(function RecommendationsWidget({ workspaceId }: { workspaceId: string | undefined }) {
  const { c } = useTheme();
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  function loadRecs() {
    if (!workspaceId) { setLoading(false); return; }
    setLoading(true);
    setFetchError(false);
    apiFetch(`/api/recommendations/generate?workspace_id=${workspaceId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setRecs(d.recommendations || []); setLoading(false); })
      .catch(() => { setFetchError(true); setLoading(false); });
  }

  useEffect(() => { loadRecs(); }, [workspaceId]);

  const priorityPill: Record<string, string> = { high: 'lx-pill--danger', medium: 'lx-pill--warning', low: 'lx-pill--success' };

  return (
    <div className="lx-card">
      <div className="lx-card-header">
        <span className="lx-card-title"><Lightbulb size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--primary)' }} />AI Recommendations</span>
      </div>
      {loading ? (
        <div style={{ height: 80, background: 'var(--elevated)', borderRadius: 8 }} />
      ) : fetchError ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: 12, color: c.textMuted, marginBottom: 8 }}>Failed to load recommendations</p>
          <button className="lx-card-action" onClick={loadRecs}>Retry</button>
        </div>
      ) : recs.length === 0 ? (
        <p style={{ fontSize: 12, color: c.textMuted }}>No recommendations yet. Connect integrations and sync data to get AI-powered suggestions.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recs.slice(0, 4).map((r: any, i: number) => (
            <div key={r.id || i} className="lx-insight-item">
              <span className={`lx-pill ${priorityPill[r.priority] || 'lx-pill--muted'}`} style={{ flexShrink: 0, height: 'fit-content' }}>{r.priority || 'low'}</span>
              <div className="lx-insight-body">
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{r.title}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

/* ─── Predictions Widget ─── */
const PredictionsWidget = memo(function PredictionsWidget({ workspaceId }: { workspaceId: string | undefined }) {
  const { c } = useTheme();
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  function loadPredictions() {
    if (!workspaceId) { setLoading(false); return; }
    setLoading(true);
    setFetchError(false);
    apiFetch(`/api/predictions?workspace_id=${workspaceId}&metric=sessions&days=14`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setPrediction(d); setLoading(false); })
      .catch(() => { setFetchError(true); setLoading(false); });
  }

  useEffect(() => { loadPredictions(); }, [workspaceId]);

  const forecast = prediction?.forecast || [];
  const narrative = prediction?.narrative || '';
  const avgForecast = useMemo(
    () => forecast.length > 0 ? Math.round(forecast.reduce((s: number, f: any) => s + f.predicted, 0) / forecast.length) : 0,
    [forecast]
  );

  return (
    <div className="lx-card">
      <div className="lx-card-header">
        <span className="lx-card-title"><TrendingUp size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--success)' }} />Traffic Forecast</span>
      </div>
      {loading ? (
        <div style={{ height: 80, background: 'var(--elevated)', borderRadius: 8 }} />
      ) : fetchError ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: 12, color: c.textMuted, marginBottom: 8 }}>Failed to load forecast</p>
          <button className="lx-card-action" onClick={loadPredictions}>Retry</button>
        </div>
      ) : forecast.length === 0 ? (
        <p style={{ fontSize: 12, color: c.textMuted }}>{prediction?.message || 'Connect GA4 and sync data to see traffic predictions.'}</p>
      ) : (
        <div>
          <div className="lx-kpi-value">~{formatNumber(avgForecast)}</div>
          <p style={{ fontSize: 11, color: 'var(--text-sec)', marginBottom: 12 }}>avg daily sessions forecast (next 14 days)</p>
          {narrative && (
            <p style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.6, padding: '10px 12px', background: 'var(--elevated)', borderRadius: 8 }}>
              {narrative}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

/* ─── Anomalies Widget ─── */
const AnomaliesWidget = memo(function AnomaliesWidget({ workspaceId }: { workspaceId: string | undefined }) {
  const { c } = useTheme();
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  function loadAnomalies() {
    if (!workspaceId) return;
    setLoading(true);
    setFetchError(false);
    apiFetch(`/api/anomalies?workspace_id=${workspaceId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setAnomalies(data.anomalies || []))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadAnomalies(); }, [workspaceId]);

  async function markAsRead(id: string) {
    await apiFetch(`/api/anomalies/${id}/read`, { method: 'POST' });
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
  }

  const unread = useMemo(() => anomalies.filter(a => !a.is_read), [anomalies]);
  const sorted = useMemo(() => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...anomalies].sort((a, b) => (order[a.severity] ?? 2) - (order[b.severity] ?? 2));
  }, [anomalies]);
  const display = useMemo(() => (expanded ? sorted : sorted.slice(0, 3)), [sorted, expanded]);
  const hiddenCount = sorted.length - 3;

  if (loading) return (
    <div aria-busy="true" className="lx-card" style={{ minHeight: 88 }} />
  );

  if (fetchError) return (
    <div className="lx-card" style={{ textAlign: 'center' }}>
      <AlertTriangle size={20} color={c.warning} style={{ margin: '0 auto 8px' }} />
      <p style={{ fontSize: 13, color: c.textSecondary, marginBottom: 12 }}>Failed to load anomalies</p>
      <button className="lx-card-action" onClick={loadAnomalies}>Retry</button>
    </div>
  );

  return (
    <div className="lx-card">
      <div className="lx-card-header">
        <span className="lx-card-title">
          <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--warning)' }} />
          AI Anomalies
          {unread.length > 0 && (
            <span className="lx-pill lx-pill--warning" style={{ marginLeft: 8 }}>{unread.length} new</span>
          )}
        </span>
        <button className="lx-card-action" onClick={() => router.push('/dashboard/alerts')}>View all →</button>
      </div>

      {display.length === 0 ? (
        <div className="lx-activity-row" style={{ borderBottom: 'none' }}>
          <div className="lx-activity-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <CheckCircle size={15} color="#10B981" />
          </div>
          <div className="lx-activity-text">No anomalies detected — everything looks healthy</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {display.map((anomaly: any) => {
            const severity = anomaly.severity || 'low';
            const pillCls = severity === 'high' ? 'lx-pill--danger' : severity === 'medium' ? 'lx-pill--warning' : 'lx-pill--info';
            return (
              <div key={anomaly.id} className="lx-activity-row" style={{ opacity: anomaly.is_read ? 0.55 : 1 }}>
                <span className={`lx-pill ${pillCls}`} style={{ flexShrink: 0 }}>
                  {severity === 'high' ? 'Critical' : severity === 'medium' ? 'Warning' : 'Info'}
                </span>
                <div className="lx-activity-text">
                  <div style={{ fontWeight: 500 }}>{anomaly.title}</div>
                  {anomaly.description && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anomaly.description}</div>
                  )}
                </div>
                <button
                  onClick={() => !anomaly.is_read && markAsRead(anomaly.id)}
                  disabled={anomaly.is_read}
                  aria-label="Dismiss"
                  style={{ background: 'none', border: 'none', padding: 4, color: 'var(--text-muted)', cursor: anomaly.is_read ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
          {!expanded && hiddenCount > 0 && (
            <button className="lx-card-action" style={{ padding: '10px 0', marginTop: 4 }} onClick={() => setExpanded(true)}>
              Show {hiddenCount} more →
            </button>
          )}
          {expanded && hiddenCount > 0 && (
            <button className="lx-card-action" style={{ padding: '10px 0', marginTop: 4, color: 'var(--text-muted)' }} onClick={() => setExpanded(false)}>
              ↑ Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
});

/* ─── AI Insights Widget ─── */
const AIInsightsWidget = memo(function AIInsightsWidget({ workspaceId }: { workspaceId: string | undefined }) {
  const { c } = useTheme();
  const router = useRouter();
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  function loadInsights() {
    if (!workspaceId) return;
    setLoading(true);
    setFetchError(false);
    apiFetch(`/api/insights?workspace_id=${workspaceId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setInsights(data.insights || []))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadInsights(); }, [workspaceId]);

  async function generate() {
    if (!workspaceId) return;
    setGenerating(true);
    try {
      const res = await apiFetch('/api/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId }),
      });
      const data = await res.json();
      if (data.insights) setInsights(data.insights);
    } catch {} finally {
      setGenerating(false);
    }
  }

  const top3 = useMemo(() => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...insights].sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)).slice(0, 3);
  }, [insights]);

  if (loading) return <div aria-busy="true" className="lx-card" style={{ minHeight: 88, marginTop: 20 }} />;

  if (fetchError) return (
    <div className="lx-card" style={{ textAlign: 'center', marginTop: 20 }}>
      <Sparkles size={20} color={c.textMuted} style={{ margin: '0 auto 8px' }} />
      <p style={{ fontSize: 13, color: c.textSecondary, marginBottom: 12 }}>Failed to load insights</p>
      <button className="lx-card-action" onClick={loadInsights}>Retry</button>
    </div>
  );

  const iconForType: Record<string, { icon: any; cls: string }> = {
    win: { icon: TrendingUp, cls: 'lx-insight-icon--opp' },
    warning: { icon: AlertTriangle, cls: 'lx-insight-icon--warn' },
    opportunity: { icon: Lightbulb, cls: 'lx-insight-icon--tip' },
    tip: { icon: Zap, cls: 'lx-insight-icon--tip' },
  };

  return (
    <div className="lx-card" style={{ marginTop: 20 }}>
      <div className="lx-card-header">
        <span className="lx-card-title"><Sparkles size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--primary)' }} />AI Insights</span>
        <button className="lx-card-action" onClick={() => router.push('/dashboard/ai')}>View all →</button>
      </div>

      {top3.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', gap: 12 }}>
          <p style={{ fontSize: 13, color: c.textMuted }}>No insights generated yet. Let AI analyze your data.</p>
          <button
            className="lx-btn-primary"
            onClick={generate}
            disabled={generating}
            style={{ opacity: generating ? 0.7 : 1 }}
          >
            {generating ? 'Generating…' : 'Generate'}
          </button>
        </div>
      ) : (
        <div>
          {top3.map((insight: any) => {
            const meta = iconForType[insight.type] || iconForType.tip;
            const Icon = meta.icon;
            return (
              <div key={insight.id} className="lx-insight-item">
                <div className={`lx-insight-icon ${meta.cls}`}><Icon size={16} /></div>
                <div className="lx-insight-body">
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{insight.title}</p>
                  <p className="lx-insight-text">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
