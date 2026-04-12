'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Users, Clock, MousePointer, Download, TrendingUp, TrendingDown, Zap, AlertCircle, Star } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell, PieChart, Pie, ReferenceLine } from 'recharts';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useWorkspace, useGA4Data } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/format';

const COLORS = ['#7C3AED','#0891B2','#10B981','#F59E0B','#ec4899','#8B5CF6'];


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
          <div className="kpi-grid">{[1,2,3,4].map(i => <Skeleton key={i} className="h-[100px] rounded-xl" />)}</div>
          <Skeleton className="h-[200px] rounded-xl" />
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
          {(() => {
            const kpis = [
              { key: 'sessions', label: 'Sessions', value: totalSessions.toLocaleString('en-IN'), sub: `${days}d period`, trend: wowChange, big: true },
              { key: 'users', label: 'Users', value: totalUsers.toLocaleString('en-IN'), sub: 'Unique visitors', trend: null },
              { key: 'pageviews', label: 'Pageviews', value: totalPageviews.toLocaleString('en-IN'), sub: `${pagesPerSession} pages/session`, trend: null },
              { key: 'wow', label: 'WoW Change', value: `${wowChange > 0 ? '+' : ''}${wowChange}%`, sub: 'vs previous period', wowCard: true, wowNegative: wowChange < 0 },
            ];
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                {kpis.map(k => {
                  const isWowNeg = k.wowCard && k.wowNegative;
                  const isWowPos = k.wowCard && !k.wowNegative && wowChange !== 0;
                  return (
                    <div key={k.key} style={{
                      backgroundColor: isWowNeg ? (isDark ? 'rgba(220,38,38,0.1)' : 'rgba(220,38,38,0.04)') : c.bgCard,
                      border: `1px solid ${c.border}`,
                      borderLeft: isWowNeg ? '3px solid #DC2626' : isWowPos ? '3px solid #059669' : `1px solid ${c.border}`,
                      borderRadius: 12, padding: 18,
                    }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{k.label}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <div style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: k.big ? 32 : 26, fontWeight: 700, color: c.text,
                          letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
                        }}>{k.value}</div>
                        {k.trend != null && k.trend !== 0 && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 2,
                            fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                            padding: '2px 7px', borderRadius: 20,
                            background: k.trend > 0 ? (isDark ? 'rgba(5,150,105,0.2)' : 'rgba(5,150,105,0.1)') : (isDark ? 'rgba(220,38,38,0.2)' : 'rgba(220,38,38,0.1)'),
                            color: k.trend > 0 ? (isDark ? '#34D399' : '#059669') : (isDark ? '#FCA5A5' : '#DC2626'),
                          }}>
                            {k.trend > 0 ? '▲' : '▼'} {Math.abs(k.trend)}%
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginTop: 4 }}>{k.sub}</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Insights strip */}
          {(anomalies.length > 0 || wowChange !== 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
              {wowChange !== 0 && (
                <div style={{
                  background: wowChange < 0 ? (isDark ? 'rgba(220,38,38,0.12)' : 'rgba(220,38,38,0.05)') : (isDark ? 'rgba(5,150,105,0.12)' : 'rgba(5,150,105,0.05)'),
                  borderLeft: `3px solid ${wowChange < 0 ? '#DC2626' : '#059669'}`,
                  border: `1px solid ${c.border}`,
                  borderRadius: 12, padding: '16px 18px',
                }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Week-over-Week</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 700, color: wowChange < 0 ? (isDark ? '#FCA5A5' : '#DC2626') : (isDark ? '#34D399' : '#059669'), letterSpacing: '-0.02em' }}>
                    {wowChange > 0 ? '+' : ''}{wowChange}%
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginTop: 2 }}>
                    {wowChange < 0 ? 'Traffic declining' : 'Traffic growing'}
                  </div>
                </div>
              )}
              {anomalies.length > 0 && (
                <div style={{
                  background: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.05)',
                  borderLeft: '3px solid #F59E0B',
                  border: `1px solid ${c.border}`,
                  borderRadius: 12, padding: '16px 18px',
                }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Anomalies Detected</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 700, color: isDark ? '#FCD34D' : '#F59E0B', letterSpacing: '-0.02em' }}>
                    {anomalies.length} anomalies
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginTop: 2 }}>Unusual spikes or drops</div>
                </div>
              )}
              {topSources[0] && (
                <div style={{
                  background: isDark ? 'rgba(5,150,105,0.12)' : 'rgba(5,150,105,0.05)',
                  borderLeft: '3px solid #059669',
                  border: `1px solid ${c.border}`,
                  borderRadius: 12, padding: '16px 18px',
                }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Top Source</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: c.text, letterSpacing: '-0.02em', textTransform: 'capitalize' }}>
                    {(topSources[0].source || 'direct')}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: isDark ? '#34D399' : '#059669', marginTop: 2, fontWeight: 600 }}>
                    {(topSources[0].sessions || 0).toLocaleString('en-IN')} sessions
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sessions trend */}
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 4 }}>Sessions Trend</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginBottom: 16 }}>Daily sessions — dashed line = period average</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis orientation="right" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: c.bgCard, border: `1px solid ${c.borderStrong}`,
                    borderRadius: 8, fontFamily: 'DM Sans', fontSize: 12,
                  }}
                  formatter={(value: any) => {
                    const pct = avgSessions > 0 ? Math.round(((value - avgSessions) / avgSessions) * 100) : 0;
                    return [`${Number(value).toLocaleString('en-IN')} (${pct >= 0 ? '+' : ''}${pct}% vs avg)`, 'Sessions'];
                  }}
                />
                <ReferenceLine y={Math.round(avgSessions)} stroke="rgba(124,58,237,0.3)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="sessions" stroke="#7C3AED" fill="url(#gSessions)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="two-col-equal" style={{ marginBottom: 20 }}>
            {/* Traffic sources — horizontal bar chart */}
            {topSources.length > 0 && (() => {
              const barColors: Record<string, string> = { google: '#7C3AED', cpc: '#0891B2', direct: '#059669' };
              const sourcesForChart = topSources.slice(0, 6).map((s, i) => {
                const pct = totalSessions > 0 ? ((s.sessions || 0) / totalSessions * 100) : 0;
                const name = (s.source || 'direct').toLowerCase();
                return {
                  name: (s.source || 'direct'),
                  sessions: s.sessions || 0,
                  pct: Number(pct.toFixed(1)),
                  fill: barColors[name] || '#94A3B8',
                };
              });
              const top = sourcesForChart[0];
              const organicKeywords = ['google', 'bing', 'duckduckgo', 'organic', 'yahoo'];
              const paidKeywords = ['cpc', 'paid', 'ads'];
              let organic = 0, paid = 0;
              for (const s of topSources) {
                const n = (s.source || '').toLowerCase();
                if (organicKeywords.some(k => n.includes(k))) organic += s.sessions || 0;
                else if (paidKeywords.some(k => n.includes(k))) paid += s.sessions || 0;
              }
              return (
                <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 4 }}>Traffic Sources</h2>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginBottom: 16 }}>Where your visitors come from</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 20, alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height={sourcesForChart.length * 36 + 20}>
                      <BarChart data={sourcesForChart} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip
                          cursor={{ fill: 'rgba(124,58,237,0.06)' }}
                          contentStyle={{ backgroundColor: c.bgCard, border: `1px solid ${c.borderStrong}`, borderRadius: 8, fontFamily: 'DM Sans', fontSize: 12 }}
                          formatter={(value: any) => [`${Number(value).toLocaleString('en-IN')} sessions`, 'Traffic']}
                        />
                        <Bar dataKey="sessions" radius={[0, 6, 6, 0]} barSize={28}
                          label={{ position: 'right', formatter: (v: any) => {
                            const row = sourcesForChart.find(r => r.sessions === v); return row ? `${row.pct}%` : '';
                          }, fill: c.textSecondary, fontSize: 11, fontFamily: 'DM Sans' }}>
                          {sourcesForChart.map((s, i) => <Cell key={i} fill={s.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, borderLeft: `1px solid ${c.border}`, paddingLeft: 16 }}>
                      <div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: c.text }}>{totalSessions.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top source</div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: c.text, textTransform: 'capitalize' }}>{top?.name}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>{top?.pct}%</div>
                      </div>
                      {(organic > 0 || paid > 0) && (
                        <div>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Organic / Paid</div>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: c.text }}>
                            <span style={{ color: '#7C3AED', fontWeight: 600 }}>{organic.toLocaleString('en-IN')}</span>
                            {' / '}
                            <span style={{ color: '#0891B2', fontWeight: 600 }}>{paid.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Top pages */}
            {topPages.length > 0 && (() => {
              const maxViews = Math.max(...topPages.slice(0, 10).map(p => p.pageviews || 0));
              return (
                <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 4 }}>Top Pages</h2>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted }}>Top 10 pages by sessions</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => exportPagesCSV(topPages)}>
                      <Download size={11} /> Export
                    </Button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 60px', gap: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 8, borderBottom: `1px solid ${c.border}` }}>
                    <span>#</span><span>Page</span><span style={{ textAlign: 'right' }}>Sessions</span>
                  </div>
                  {topPages.slice(0, 10).map((p, i) => {
                    const views = p.pageviews || 0;
                    const pct = maxViews > 0 ? (views / maxViews) * 100 : 0;
                    const path = p.page || '';
                    const truncated = path.length > 40 ? path.slice(0, 37) + '…' : path;
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 60px', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: i < 9 ? `1px solid ${c.border}` : 'none' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: c.textMuted, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                        <div style={{ minWidth: 0 }}>
                          <div title={path} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truncated || '/'}</div>
                          <div style={{ marginTop: 4, height: 4, borderRadius: 2, backgroundColor: c.bgCardHover, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 2, background: '#7C3AED', width: `${pct}%` }} />
                          </div>
                        </div>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: c.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{views.toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </>
      )}
    </PageShell>
  );
}
