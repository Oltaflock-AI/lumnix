'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Users, Clock, MousePointer, Download, TrendingUp, TrendingDown, Zap, AlertCircle, Star } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useWorkspace, useGA4Data } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';

const COLORS = ['#7C3AED','#0891B2','#10B981','#F59E0B','#ec4899','#3b82f6'];

function SkeletonBox({ h = 100 }: { h?: number }) {
  const { c } = useTheme();
  return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, height: `${h}px`, animation: 'pulse 1.5s ease-in-out infinite' }}>
      <div style={{ margin: '18px', height: '12px', backgroundColor: c.bgCardHover, borderRadius: '4px', width: '40%' }} />
    </div>
  );
}

function InsightCard({ icon: Icon, color, title, value, sub }: { icon: any; color: string; title: string; value: string; sub: string }) {
  const { c } = useTheme();
  return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: c.text, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{value}</div>
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

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();
  const { c } = useTheme();
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
  // Check if we ever had data (to distinguish "never synced" from "no data for this range")
  const { data: anyDataCheck } = useGA4Data(workspaceId, 'overview', 90);
  const hasSyncedBefore = (anyDataCheck?.data?.length || 0) > 0;

  // KPI totals
  const totalSessions = overviewData.reduce((s: number, r: any) => s + (r.sessions || 0), 0);
  const totalUsers = overviewData.reduce((s: number, r: any) => s + (r.users || 0), 0);
  const totalPageviews = overviewData.reduce((s: number, r: any) => s + (r.pageviews || 0), 0);
  const pagesPerSession = totalSessions > 0 ? (totalPageviews / totalSessions).toFixed(1) : '0';

  // Week-over-week comparison
  const half = Math.floor(overviewData.length / 2);
  const thisWeekSessions = overviewData.slice(half).reduce((s: number, r: any) => s + (r.sessions || 0), 0);
  const lastWeekSessions = overviewData.slice(0, half).reduce((s: number, r: any) => s + (r.sessions || 0), 0);
  const wowChange = lastWeekSessions > 0 ? Math.round(((thisWeekSessions - lastWeekSessions) / lastWeekSessions) * 100) : 0;

  // Anomaly detection — days with sessions > 1.5x average or < 0.5x average
  const avgSessions = totalSessions / (overviewData.length || 1);
  const anomalies = overviewData.filter((r: any) => r.sessions > avgSessions * 1.5 || r.sessions < avgSessions * 0.5);

  // Chart data
  const trendData = overviewData.slice(-14).map((r: any) => ({
    day: r.date?.slice(5) ?? '',
    sessions: r.sessions || 0,
    users: r.users || 0,
  }));

  // Sources
  const topSources = [...sourcesData].sort((a, b) => (b.sessions || 0) - (a.sessions || 0)).slice(0, 8);

  // Pages
  const topPages = [...pagesData].sort((a, b) => (b.pageviews || 0) - (a.pageviews || 0)).slice(0, 15);

  const tooltipStyle = { backgroundColor: c.bgCard, border: `1px solid ${c.borderStrong}`, borderRadius: 8, color: c.text, fontSize: 12 };

  return (
    <PageShell title="Web Analytics" description="GA4 traffic data — sessions, users, sources, and top pages" icon={BarChart3}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <DateRangePicker value={days} onChange={setDays} />
      </div>

      {loading && (
        <>
          <div className="kpi-grid">{[1,2,3,4].map(i => <SkeletonBox key={i} h={100} />)}</div>
          <SkeletonBox h={200} />
        </>
      )}

      {!loading && !hasData && hasSyncedBefore && (
        <div style={{ textAlign: 'center', padding: '40px 20px', borderRadius: 12, border: `1px dashed ${c.border}`, backgroundColor: c.bgCard }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 4 }}>No data for the last {days} days</p>
          <p style={{ fontSize: 13, color: c.textMuted }}>Try a longer date range or sync to pull the latest data.</p>
        </div>
      )}

      {!loading && !hasData && !hasSyncedBefore && (
        <EmptyState
          icon={BarChart3}
          title="No GA4 data found"
          description="Your Google Analytics account is connected. Click Sync Now to pull your analytics data."
          actionLabel={syncing ? "Syncing..." : "Sync Now"}
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
          {/* KPIs */}
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Sessions', value: totalSessions.toLocaleString(), icon: BarChart3, color: c.accent, sub: `${days}d period` },
              { label: 'Users', value: totalUsers.toLocaleString(), icon: Users, color: '#3b82f6', sub: 'Unique visitors' },
              { label: 'Pageviews', value: totalPageviews.toLocaleString(), icon: MousePointer, color: c.success, sub: `${pagesPerSession} pages/session` },
              { label: 'WoW Change', value: `${wowChange > 0 ? '+' : ''}${wowChange}%`, icon: wowChange >= 0 ? TrendingUp : TrendingDown, color: wowChange >= 0 ? c.success : c.danger, sub: 'vs previous period' },
            ].map(kpi => (
              <div key={kpi.label} style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <kpi.icon size={14} color={kpi.color} />
                  <span style={{ fontSize: 12, color: c.textSecondary }}>{kpi.label}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: c.text, fontFamily: 'var(--font-mono)', marginBottom: 3 }}>{kpi.value}</div>
                <div style={{ fontSize: 11, color: c.textMuted }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Insights row */}
          {(anomalies.length > 0 || wowChange !== 0) && (
            <div className="three-col" style={{ marginBottom: 20 }}>
              {wowChange !== 0 && (
                <InsightCard
                  icon={wowChange > 0 ? TrendingUp : TrendingDown}
                  color={wowChange > 0 ? c.success : c.danger}
                  title="Week-over-Week"
                  value={`${wowChange > 0 ? '+' : ''}${wowChange}%`}
                  sub={wowChange > 0 ? 'Traffic growing' : 'Traffic declining'}
                />
              )}
              {anomalies.length > 0 && (
                <InsightCard
                  icon={Zap}
                  color={c.warning}
                  title="Anomalies Detected"
                  value={`${anomalies.length} days`}
                  sub="Unusual traffic spikes or drops"
                />
              )}
              {topSources[0] && (
                <InsightCard
                  icon={Star}
                  color={c.accent}
                  title="Top Source"
                  value={topSources[0].source || 'direct'}
                  sub={`${topSources[0].sessions?.toLocaleString()} sessions`}
                />
              )}
            </div>
          )}

          {/* Sessions trend */}
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 4 }}>Sessions Trend</h2>
            <p style={{ fontSize: 12, color: c.textMuted, marginBottom: 16 }}>Daily sessions over the last 14 days</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.accent} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke={c.border} tick={{ fill: c.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis stroke={c.border} tick={{ fill: c.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="sessions" stroke={c.accent} fill="url(#gSessions)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="two-col-equal" style={{ marginBottom: 20 }}>
            {/* Traffic sources */}
            {topSources.length > 0 && (
              <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 4 }}>Traffic Sources</h2>
                <p style={{ fontSize: 12, color: c.textMuted, marginBottom: 16 }}>Where your visitors come from</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {topSources.slice(0, 6).map((s, i) => {
                    const pct = totalSessions > 0 ? ((s.sessions || 0) / totalSessions * 100) : 0;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: c.text, fontWeight: 500, textTransform: 'capitalize' }}>{s.source || 'direct'}</span>
                          <span style={{ fontSize: 12, color: c.textSecondary, fontFamily: 'var(--font-mono)' }}>{(s.sessions || 0).toLocaleString()} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, backgroundColor: c.bgCardHover, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, backgroundColor: COLORS[i % COLORS.length], width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top pages */}
            {topPages.length > 0 && (
              <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 4 }}>Top Pages</h2>
                    <p style={{ fontSize: 12, color: c.textMuted }}>Highest traffic pages</p>
                  </div>
                  <button onClick={() => exportPagesCSV(topPages)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: `1px solid ${c.borderStrong}`, backgroundColor: 'transparent', color: c.textSecondary, fontSize: 11, cursor: 'pointer' }}>
                    <Download size={11} /> Export
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {topPages.slice(0, 8).map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 7 ? `1px solid ${c.border}` : 'none' }}>
                      <span style={{ fontSize: 11, color: c.textMuted, width: 20, textAlign: 'right', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{i + 1}</span>
                      <span style={{ flex: 1, fontSize: 12, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: c.text, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{(p.pageviews || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}
