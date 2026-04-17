'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Users, Clock, MousePointer, Download, TrendingUp, TrendingDown, Zap, AlertCircle, Star } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell, PieChart, Pie, ReferenceLine } from 'recharts';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useGA4Data } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/format';
import { Sparkline } from '@/components/Sparkline';

const COLORS = ['#FF0066','#00D4AA','#10B981','#F59E0B','#ec4899','#FF3385'];

function InsightCard({ icon: Icon, color, title, value, sub }: { icon: any; color: string; title: string; value: string; sub: string }) {
  const { c } = useTheme();
  return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: c.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', marginBottom: 2 }}>{value}</div>
        <div style={{ fontSize: 12, color: c.textSecondary }}>{sub}</div>
      </div>
    </div>
  );
}

function exportPagesCSV(pages: any[]) {
  const headers = ['Page', 'Views', 'Bounce Rate'];
  const rows = pages.map((p: any) => [p.page, p.pageviews, `${p.bounceRate}%`]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'lumnix-pages.csv'; a.click();
  URL.revokeObjectURL(url);
}

// Gradient color palette for progress bars (mockup parity)
const PROG_COLORS = ['#FF0066', '#00D4AA', '#7B61FF', '#FF8A00', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
const GEO_GRADIENTS = [
  'linear-gradient(90deg, #FF0066, #FF3385)',
  'linear-gradient(90deg, #00D4AA, #00E8BE)',
  'linear-gradient(90deg, #7B61FF, #9078FF)',
  'linear-gradient(90deg, #FF8A00, #FFB000)',
  'linear-gradient(90deg, #EF4444, #F87171)',
];

// Format seconds to "Xm YYs"
function fmtDuration(sec: number): string {
  if (!sec || !isFinite(sec)) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();
  const { c, theme } = useTheme();
  const isDark = theme === 'dark';
  const { workspace, loading: wsLoading } = useWorkspaceCtx();
  const workspaceId = workspace?.id;

  const { data: overviewResp, loading: overviewLoading } = useGA4Data(workspaceId, 'overview', days);
  const { data: sourcesResp, loading: sourcesLoading } = useGA4Data(workspaceId, 'sources', days);
  const { data: pagesResp, loading: pagesLoading } = useGA4Data(workspaceId, 'pages', days);

  const loading = wsLoading || overviewLoading || sourcesLoading || pagesLoading;

  const overviewData: any[] = overviewResp?.data || [];
  const sourcesData: any[] = sourcesResp?.data || [];
  const pagesData: any[] = pagesResp?.data || [];

  const hasData = overviewData.length > 0;
  const { data: anyDataCheck } = useGA4Data(workspaceId, 'overview', 90);
  const hasSyncedBefore = (anyDataCheck?.data?.length || 0) > 0;

  const { totalSessions, totalUsers, totalPageviews, pagesPerSession, wowChange, anomalies, avgSessions, avgSessionDuration, bounceRate } = useMemo(() => {
    const sessions = overviewData.reduce((s: number, r: any) => s + (r.sessions || 0), 0);
    const users = overviewData.reduce((s: number, r: any) => s + (r.users || 0), 0);
    const pageviews = overviewData.reduce((s: number, r: any) => s + (r.pageviews || 0), 0);
    const half = Math.floor(overviewData.length / 2);
    const thisWeek = overviewData.slice(half).reduce((s: number, r: any) => s + (r.sessions || 0), 0);
    const lastWeek = overviewData.slice(0, half).reduce((s: number, r: any) => s + (r.sessions || 0), 0);
    const avg = sessions / (overviewData.length || 1);
    const totalDur = overviewData.reduce((s: number, r: any) => s + ((r.avgSessionDuration || r.avg_session_duration || 0) * (r.sessions || 0)), 0);
    const avgDur = sessions > 0 ? totalDur / sessions : 0;
    const bounceTotal = overviewData.reduce((s: number, r: any) => s + ((r.bounceRate || r.bounce_rate || 0) * (r.sessions || 0)), 0);
    const avgBounce = sessions > 0 ? bounceTotal / sessions : 0;
    return {
      totalSessions: sessions,
      totalUsers: users,
      totalPageviews: pageviews,
      pagesPerSession: sessions > 0 ? (pageviews / sessions).toFixed(1) : '0',
      wowChange: lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0,
      anomalies: overviewData.filter((r: any) => r.sessions > avg * 1.5 || r.sessions < avg * 0.5),
      avgSessions: avg,
      avgSessionDuration: avgDur,
      bounceRate: avgBounce,
    };
  }, [overviewData]);

  const trendData = useMemo(() => overviewData.slice(-14).map((r: any) => ({
    day: r.date?.slice(5) ?? '',
    sessions: r.sessions || 0,
    users: r.users || 0,
  })), [overviewData]);

  // Daily series for KPI sparklines (real GA4 overview data)
  const usersSeries = useMemo<number[]>(
    () => overviewData.map((r: any) => Number(r.users) || 0),
    [overviewData]
  );
  const pageviewsSeries = useMemo<number[]>(
    () => overviewData.map((r: any) => Number(r.pageviews) || 0),
    [overviewData]
  );
  const sessionsSeries = useMemo<number[]>(
    () => overviewData.map((r: any) => Number(r.sessions) || 0),
    [overviewData]
  );
  const bounceRateSeries = useMemo<number[]>(
    () => overviewData.map((r: any) => Number(r.bounceRate ?? r.bounce_rate) || 0),
    [overviewData]
  );

  const topSources = useMemo(
    () => [...sourcesData].sort((a, b) => (b.sessions || 0) - (a.sessions || 0)).slice(0, 8),
    [sourcesData]
  );
  const topPages = useMemo(
    () => [...pagesData].sort((a, b) => (b.pageviews || 0) - (a.pageviews || 0)).slice(0, 15),
    [pagesData]
  );

  const tooltipStyle = useMemo(
    () => ({ backgroundColor: c.bgCard, border: `1px solid ${c.borderStrong}`, borderRadius: 8, color: c.text, fontSize: 12 }),
    [c.bgCard, c.borderStrong, c.text]
  );

  // Device mix — GA4 data may not include this; fall back to placeholder rendering
  const deviceMix: { label: string; value: number; pct: number; color: string }[] = [];

  // Geography — GA4 data may not include this; empty until wired
  const geoData: { country: string; sessions: number; pct: number }[] = [];

  return (
    <div className="lx-content">
      {/* Welcome header */}
      <div className="lx-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1><span>Analytics Overview</span></h1>
          <div className="lx-welcome-sub">
            <span className="lx-welcome-dot" />
            {days}-day performance metrics
          </div>
        </div>
        <DateRangePicker value={days} onChange={setDays} />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="lx-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${c.border}`, borderTopColor: '#FF0066', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: c.textMuted }}>Loading analytics…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      )}

      {/* Empty: synced before, no data in range */}
      {!loading && !hasData && hasSyncedBefore && (
        <div className="lx-card" style={{ textAlign: 'center', padding: '40px 20px', borderStyle: 'dashed' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 4 }}>No data for the last {days} days</p>
          <p style={{ fontSize: 13, color: c.textMuted }}>Try a longer date range or sync to pull the latest data.</p>
        </div>
      )}

      {/* Empty: never synced */}
      {!loading && !hasData && !hasSyncedBefore && (
        <EmptyState
          icon={BarChart3}
          title="No GA4 data found"
          description="Your Google Analytics account is connected. Click Sync Now to pull your analytics data."
          actionLabel={syncing ? 'Syncing...' : 'Sync Now'}
          onAction={() => {
            if (!workspaceId) { router.push('/dashboard/settings'); return; }
            setSyncing(true);
            import('@/lib/supabase').then(({ supabase }) =>
              supabase.auth.getSession().then(({ data: { session } }) => {
                if (!session) { router.push('/dashboard/settings'); setSyncing(false); return; }
                return fetch('/api/integrations/list?workspace_id=' + workspaceId, {
                  headers: { Authorization: `Bearer ${session.access_token}` },
                }).then(r => r.json()).then(res => {
                  const ga4Int = (res.integrations || []).find((i: any) => i.provider === 'ga4' && i.status === 'connected');
                  if (!ga4Int) { router.push('/dashboard/settings'); setSyncing(false); return; }
                  return fetch('/api/sync/ga4', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                    body: JSON.stringify({ integration_id: ga4Int.id, workspace_id: workspaceId }),
                  }).then(() => window.location.reload());
                });
              })
            ).catch(err => console.error('Sync failed:', err)).finally(() => setSyncing(false));
          }}
        />
      )}

      {!loading && hasData && (
        <>
          {/* KPI Cards */}
          <div className="lx-kpi-grid">
            {/* Users */}
            <div className="lx-kpi-card">
              <div className="lx-kpi-top">
                <span className="lx-kpi-label">Users</span>
                <div className="lx-icon-pill lx-icon-pill--primary">
                  <Users size={16} color="#FF0066" strokeWidth={1.8} />
                </div>
              </div>
              <div className="lx-kpi-value">{totalUsers > 0 ? totalUsers.toLocaleString('en-US') : '—'}</div>
              <Sparkline
                data={usersSeries}
                color="#FF0066"
                className="lx-sparkline"
                ariaLabel="Users trend"
              />
              <div className="lx-kpi-footer">
                {wowChange !== 0 ? (
                  <span className={`lx-delta ${wowChange > 0 ? 'lx-delta--up' : 'lx-delta--down'}`}>
                    {wowChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(wowChange)}%
                  </span>
                ) : (
                  <span className="lx-kpi-compare">—</span>
                )}
                <span className="lx-kpi-compare">vs prev. period</span>
              </div>
            </div>

            {/* Pageviews */}
            <div className="lx-kpi-card">
              <div className="lx-kpi-top">
                <span className="lx-kpi-label">Pageviews</span>
                <div className="lx-icon-pill lx-icon-pill--primary">
                  <MousePointer size={16} color="#FF0066" strokeWidth={1.8} />
                </div>
              </div>
              <div className="lx-kpi-value">{totalPageviews > 0 ? totalPageviews.toLocaleString('en-US') : '—'}</div>
              <Sparkline
                data={pageviewsSeries}
                color="#00D4AA"
                className="lx-sparkline"
                ariaLabel="Pageviews trend"
              />
              <div className="lx-kpi-footer">
                <span className="lx-kpi-compare">{pagesPerSession} pages/session</span>
              </div>
            </div>

            {/* Avg Session */}
            <div className="lx-kpi-card">
              <div className="lx-kpi-top">
                <span className="lx-kpi-label">Avg Session</span>
                <div className="lx-icon-pill lx-icon-pill--primary">
                  <Clock size={16} color="#FF0066" strokeWidth={1.8} />
                </div>
              </div>
              <div className="lx-kpi-value">{avgSessionDuration > 0 ? fmtDuration(avgSessionDuration) : '—'}</div>
              <Sparkline
                data={sessionsSeries}
                color="#7B61FF"
                className="lx-sparkline"
                ariaLabel="Sessions trend"
              />
              <div className="lx-kpi-footer">
                <span className="lx-kpi-compare">avg duration</span>
              </div>
            </div>

            {/* Bounce Rate */}
            <div className="lx-kpi-card">
              <div className="lx-kpi-top">
                <span className="lx-kpi-label">Bounce Rate</span>
                <div className="lx-icon-pill lx-icon-pill--primary">
                  <AlertCircle size={16} color="#FF0066" strokeWidth={1.8} />
                </div>
              </div>
              <div className="lx-kpi-value">{bounceRate > 0 ? `${(bounceRate * (bounceRate > 1 ? 1 : 100)).toFixed(1)}%` : '—'}</div>
              <Sparkline
                data={bounceRateSeries}
                color="#F59E0B"
                className="lx-sparkline"
                ariaLabel="Bounce rate trend"
              />
              <div className="lx-kpi-footer">
                <span className="lx-kpi-compare">session-level</span>
              </div>
            </div>
          </div>

          {/* Large Area Chart: Sessions over Time */}
          <div className="lx-card" style={{ marginBottom: 24 }}>
            <div className="lx-card-header">
              <span className="lx-card-title">Sessions over Time</span>
              <span className="lx-pill lx-pill--primary">{days} days</span>
            </div>
            <div className="lx-chart-area">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF0066" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#FF0066" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis orientation="right" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <ReferenceLine y={Math.round(avgSessions)} stroke="rgba(255,0,102,0.3)" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="users" stroke="#00D4AA" fill="url(#gUsers)" strokeWidth={2.5} dot={false} />
                  <Area type="monotone" dataKey="sessions" stroke="#FF0066" fill="url(#gSessions)" strokeWidth={3} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="lx-chart-legend">
              <span className="lx-legend-item"><span className="lx-legend-dot" style={{ background: '#FF0066' }} />Sessions</span>
              <span className="lx-legend-item"><span className="lx-legend-dot" style={{ background: '#00D4AA' }} />Users</span>
            </div>
          </div>

          {/* Two-column: Top Pages Table + Device Mix Donut */}
          <div className="lx-grid-60-40">
            {/* Top Pages Table */}
            <div className="lx-card">
              <div className="lx-card-header">
                <span className="lx-card-title">Top Pages</span>
                <span className="lx-card-action" onClick={() => exportPagesCSV(topPages)}>Export &rarr;</span>
              </div>
              <table className="lx-table">
                <thead className="lx-table-header">
                  <tr>
                    <th style={{ width: '50%' }}>Page</th>
                    <th style={{ width: '20%' }}>Views</th>
                    <th style={{ width: '30%' }}>Share</th>
                  </tr>
                </thead>
                <tbody className="lx-table-body">
                  {topPages.slice(0, 6).map((p, i) => {
                    const views = p.pageviews || 0;
                    const maxViews = topPages[0]?.pageviews || 1;
                    const pct = (views / maxViews) * 100;
                    const path = p.page || '/';
                    const truncated = path.length > 40 ? path.slice(0, 37) + '…' : path;
                    return (
                      <tr key={i}>
                        <td><span className="lx-table-url">{truncated}</span></td>
                        <td style={{ fontWeight: 600 }}>{views.toLocaleString('en-US')}</td>
                        <td>
                          <div className="lx-progress-bar"><div className="lx-progress-fill" style={{ width: `${pct}%`, background: PROG_COLORS[i % PROG_COLORS.length] }} /></div>
                          <small style={{ fontSize: 10, color: c.textMuted }}>{pct.toFixed(0)}% of top</small>
                        </td>
                      </tr>
                    );
                  })}
                  {topPages.length === 0 && (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20, color: c.textMuted }}>—</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Device Mix Donut — placeholder until GA4 device dim is wired */}
            <div className="lx-card">
              <div className="lx-card-header">
                <span className="lx-card-title">Device Mix</span>
                <span className="lx-pill lx-pill--primary">{days} days</span>
              </div>
              <div className="lx-donut-wrap">
                <div className="lx-donut-chart">
                  {/* TODO: real device-breakdown data points */}
                  <svg viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="56" fill="none" stroke="var(--border)" strokeWidth="14" />
                    <circle cx="70" cy="70" r="56" fill="none" stroke="#FF0066" strokeWidth="14" strokeDasharray="173.9 360" strokeDashoffset="0" transform="rotate(-90 70 70)" />
                    <circle cx="70" cy="70" r="56" fill="none" stroke="#00D4AA" strokeWidth="14" strokeDasharray="87.1 360" strokeDashoffset="-173.9" transform="rotate(-90 70 70)" />
                    <circle cx="70" cy="70" r="56" fill="none" stroke="#7B61FF" strokeWidth="14" strokeDasharray="19.6 360" strokeDashoffset="-261" transform="rotate(-90 70 70)" />
                    <text x="70" y="65" textAnchor="middle" fill="var(--text)" fontFamily="Outfit" fontSize="22" fontWeight="700">
                      {totalPageviews >= 1000 ? `${(totalPageviews / 1000).toFixed(1)}K` : totalPageviews || '—'}
                    </text>
                    <text x="70" y="82" textAnchor="middle" fill="var(--text-muted)" fontSize="10">total views</text>
                  </svg>
                </div>
                <div className="lx-donut-legend">
                  <div className="lx-donut-row">
                    <span className="lx-donut-color" style={{ background: '#FF0066' }} />
                    <span className="lx-donut-label">Desktop</span>
                    <span className="lx-donut-val">—</span>
                    <span className="lx-donut-pct">—</span>
                  </div>
                  <div className="lx-donut-row">
                    <span className="lx-donut-color" style={{ background: '#00D4AA' }} />
                    <span className="lx-donut-label">Mobile</span>
                    <span className="lx-donut-val">—</span>
                    <span className="lx-donut-pct">—</span>
                  </div>
                  <div className="lx-donut-row">
                    <span className="lx-donut-color" style={{ background: '#7B61FF' }} />
                    <span className="lx-donut-label">Tablet</span>
                    <span className="lx-donut-val">—</span>
                    <span className="lx-donut-pct">—</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Sources bar chart */}
          {topSources.length > 0 && (
            <div className="lx-card" style={{ marginBottom: 24 }}>
              <div className="lx-card-header">
                <span className="lx-card-title">Top Traffic Sources</span>
                <span className="lx-card-action">View all &rarr;</span>
              </div>
              <div style={{ padding: '12px 0' }}>
                {topSources.slice(0, 5).map((s, i) => {
                  const sess = s.sessions || 0;
                  const pct = totalSessions > 0 ? (sess / totalSessions * 100) : 0;
                  const name = s.source || 'direct';
                  return (
                    <div key={i} style={{ marginBottom: i === topSources.slice(0, 5).length - 1 ? 0 : 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: c.text, fontWeight: 500, textTransform: 'capitalize' }}>{name}</span>
                        <span style={{ fontSize: 12, color: c.textMuted, fontWeight: 600 }}>{sess.toLocaleString('en-US')} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div style={{ height: 24, background: 'var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: GEO_GRADIENTS[i % GEO_GRADIENTS.length], borderRadius: 8 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Anomalies insight strip */}
          {(anomalies.length > 0 || wowChange !== 0 || topSources[0]) && (
            <div className="lx-grid-3">
              {wowChange !== 0 && (
                <InsightCard
                  icon={wowChange < 0 ? TrendingDown : TrendingUp}
                  color={wowChange < 0 ? '#EF4444' : '#10B981'}
                  title="Week-over-Week"
                  value={`${wowChange > 0 ? '+' : ''}${wowChange}%`}
                  sub={wowChange < 0 ? 'Traffic declining' : 'Traffic growing'}
                />
              )}
              {anomalies.length > 0 && (
                <InsightCard
                  icon={Zap}
                  color="#F59E0B"
                  title="Anomalies Detected"
                  value={`${anomalies.length} anomalies`}
                  sub="Unusual spikes or drops"
                />
              )}
              {topSources[0] && (
                <InsightCard
                  icon={Star}
                  color="#10B981"
                  title="Top Source"
                  value={(topSources[0].source || 'direct')}
                  sub={`${(topSources[0].sessions || 0).toLocaleString('en-US')} sessions`}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
