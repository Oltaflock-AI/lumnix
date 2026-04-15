'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, TrendingDown, AlertTriangle, Download, Zap, Star, Target, Eye } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useWorkspace, useGSCData } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/format';

function exportCSV(keywords: any[]) {
  const headers = ['Keyword', 'Position', 'Impressions', 'Clicks', 'CTR', 'Signal'];
  const rows = keywords.map((kw: any) => [kw.query, kw.position, kw.impressions, kw.clicks, `${kw.ctr.toFixed(1)}%`, kw.signal || '']);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'lumnix-keywords.csv'; a.click();
  URL.revokeObjectURL(url);
}

function InsightPill({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: `${color}18`, color }}>
      {label}
    </span>
  );
}

export default function SEOPage() {
  const [days, setDays] = useState(30);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'quick-wins' | 'top3' | 'low-ctr'>('all');
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { c, theme } = useTheme();
  const isDark = theme === 'dark';
  const { workspace, loading: wsLoading } = useWorkspaceCtx();
  const workspaceId = workspace?.id;

  const { data: kwResp, loading: kwLoading } = useGSCData(workspaceId, 'keywords', days);
  const { data: overviewResp, loading: overviewLoading } = useGSCData(workspaceId, 'overview', days);

  const loading = wsLoading || kwLoading || overviewLoading;

  const allKeywords: any[] = kwResp?.keywords || [];
  const overviewData: any[] = overviewResp?.overview || [];

  const hasData = allKeywords.length > 0;
  const { data: anyDataCheck } = useGSCData(workspaceId, 'keywords', 90);
  const hasSyncedBefore = (anyDataCheck?.keywords?.length || 0) > 0;

  const avgCTRValue = allKeywords.length > 0
    ? allKeywords.reduce((s, k) => s + k.ctr, 0) / allKeywords.length : 0;

  const keywords = allKeywords.map(kw => ({
    ...kw,
    signal: kw.position <= 3 ? 'top3'
      : (kw.position >= 4 && kw.position <= 10 && kw.ctr < avgCTRValue * 0.7) ? 'quick-win'
      : (kw.impressions > 500 && kw.ctr < 1) ? 'low-ctr'
      : '',
  }));

  const totalClicks = keywords.reduce((s, r) => s + (r.clicks || 0), 0);
  const totalImpressions = keywords.reduce((s, r) => s + (r.impressions || 0), 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';
  const avgPosition = keywords.length > 0
    ? (keywords.reduce((s, r) => s + (r.position || 0), 0) / keywords.length).toFixed(1) : '0';

  const top3 = keywords.filter(k => k.position <= 3).length;
  const top10 = keywords.filter(k => k.position > 3 && k.position <= 10).length;
  const top20 = keywords.filter(k => k.position > 10 && k.position <= 20).length;
  const beyond = keywords.filter(k => k.position > 20).length;

  const bucketData = [
    { label: '#1-3', count: top3, color: '#059669' },
    { label: '#4-10', count: top10, color: '#7C3AED' },
    { label: '#11-20', count: top20, color: '#F59E0B' },
    { label: '20+', count: beyond, color: '#94A3B8' },
  ];

  const quickWins = keywords.filter(k => k.position >= 4 && k.position <= 10 && k.ctr < avgCTRValue * 0.7).slice(0, 5);

  const filteredKeywords = keywords
    .filter(k => {
      if (filter === 'quick-wins') return k.position >= 4 && k.position <= 10 && k.ctr < avgCTRValue * 0.7;
      if (filter === 'top3') return k.position <= 3;
      if (filter === 'low-ctr') return k.impressions > 500 && k.ctr < 1;
      return true;
    })
    .filter(k => !search || k.query.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 50);

  const trendData = overviewData.slice(-14).map(r => ({
    day: r.date?.slice(5) ?? '',
    clicks: r.clicks || 0,
    impressions: (r.impressions || 0) / 10,
  }));

  const tooltipStyle = { backgroundColor: c.bgCard, border: `1px solid ${c.borderStrong}`, borderRadius: 8, color: c.text, fontSize: 12 };

  return (
    <PageShell title="SEO Intelligence" description="Google Search Console data — insights beyond native GSC" icon={Search}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <DateRangePicker value={days} onChange={setDays} />
      </div>

      {loading && (
        <>
          <div className="kpi-grid">
            {[1,2,3,4].map(i => (
              <div key={i} style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, height: 100, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, height: 200 }} />
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
          icon={Search}
          title="No GSC data found"
          description="Your Search Console is connected. Click Sync Now to pull your keyword and search data."
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
                  const gscInt = (res.integrations || []).find((i: any) => i.provider === 'gsc' && i.status === 'connected');
                  if (!gscInt) { router.push('/dashboard/settings'); setSyncing(false); return; }
                  return fetch('/api/sync/gsc', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                    body: JSON.stringify({ integration_id: gscInt.id, workspace_id: workspaceId }),
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
            const ctrNum = parseFloat(avgCTR);
            const posNum = parseFloat(avgPosition);
            const posLabel = posNum < 10 ? { text: 'Page 1', color: '#059669' } : posNum < 20 ? { text: 'Page 2', color: '#F59E0B' } : { text: `Page ${Math.ceil(posNum / 10)}`, color: '#94A3B8' };
            const items = [
              { key: 'clicks', label: 'Total Clicks', value: formatNumber(totalClicks), sub: `${days}d period`, icon: TrendingUp, iconColor: '#7C3AED' },
              { key: 'impr', label: 'Impressions', value: formatNumber(totalImpressions), sub: 'Search appearances', icon: Eye, iconColor: '#0891B2' },
              { key: 'ctr', label: 'Avg CTR', value: `${avgCTR}%`, sub: top3 > 0 ? `${top3} keywords in top 3` : 'Improve titles', icon: Target, iconColor: ctrNum > 10 ? '#059669' : ctrNum < 2 ? '#DC2626' : '#7C3AED', accent: ctrNum > 10 ? 'green' : ctrNum < 2 ? 'red' : null },
              { key: 'pos', label: 'Avg Position', value: avgPosition, sub: `${keywords.length} keywords tracked`, icon: Search, iconColor: '#F59E0B', extraLabel: posLabel },
            ];
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                {items.map(kpi => (
                  <div key={kpi.key} style={{
                    backgroundColor: c.bgCard,
                    border: `1px solid ${c.border}`,
                    borderLeft: kpi.accent === 'green' ? '3px solid #059669' : kpi.accent === 'red' ? '3px solid #DC2626' : `1px solid ${c.border}`,
                    borderRadius: 12, padding: 18,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <kpi.icon size={14} color={kpi.iconColor} />
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</span>
                    </div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 700, color: c.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted }}>{kpi.sub}</div>
                      {kpi.extraLabel && (
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: kpi.extraLabel.color }}>· {kpi.extraLabel.text}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Position distribution + Quick wins */}
          <div className="two-col-equal" style={{ marginBottom: 20 }}>
            <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 4 }}>Ranking Distribution</h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginBottom: 16 }}>How many keywords rank in each position bucket</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={bucketData} barCategoryGap="30%" margin={{ top: 20, right: 12, bottom: 0, left: 0 }}>
                  <XAxis dataKey="label" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: c.bgCard, border: `1px solid ${c.borderStrong}`, borderRadius: 8, fontFamily: 'DM Sans', fontSize: 12 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={48} minPointSize={4}
                    label={{ position: 'top', fill: c.textSecondary, fontSize: 12, fontFamily: 'DM Sans', fontWeight: 600 }}>
                    {bucketData.map((entry, i) => <Cell key={i} fill={entry.count === 0 ? '#E4E2F4' : entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                {bucketData.map(b => (
                  <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: b.color }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: c.textSecondary }}>{b.label}: {b.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick wins */}
            <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Zap size={16} color="#F59E0B" />
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: c.text }}>Quick Wins</h2>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginBottom: 16 }}>Positions 4-10 with low CTR — improve titles to jump to page 1</p>
              {quickWins.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', textAlign: 'center' }}>
                  <div style={{
                    width: 48, height: 48, background: '#ECFDF5', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <h4 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: '#065F46', marginBottom: 6 }}>CTRs look healthy!</h4>
                  <p style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.5, maxWidth: 280, margin: 0 }}>No keywords in positions 4-10 with below-average CTR. Keep it up.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {quickWins.map(kw => (
                    <div key={kw.query} style={{
                      background: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)',
                      border: isDark ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(245,158,11,0.2)',
                      borderRadius: 10, padding: '12px 14px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '2px 8px', borderRadius: 20,
                          background: '#F59E0B', color: '#fff',
                          fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700,
                        }}>#{Math.round(kw.position)}</span>
                        <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: c.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kw.query}</span>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#DC2626' }}>{kw.ctr.toFixed(1)}% CTR</span>
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginLeft: 38 }}>
                        {formatNumber(kw.impressions)} impressions, {kw.clicks} click{kw.clicks === 1 ? '' : 's'}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#7C3AED', fontStyle: 'italic', marginTop: 6, marginLeft: 38 }}>
                        ▶ Optimize title to capture this traffic
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Clicks trend */}
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 4 }}>Organic Clicks Trend</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginBottom: 16 }}>Daily organic clicks from Google Search</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis orientation="right" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: c.bgCard, border: `1px solid ${c.borderStrong}`, borderRadius: 8, fontFamily: 'DM Sans', fontSize: 12 }} />
                <Area type="monotone" dataKey="clicks" stroke="#7C3AED" fill="url(#gClicks)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Full keyword table */}
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: c.text }}>All Keywords</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search keywords..."
                  style={{
                    height: 36, padding: '0 12px', borderRadius: 8,
                    border: `1px solid ${c.border}`,
                    backgroundColor: c.bgCardHover, color: c.text,
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, width: 200,
                    outline: 'none',
                  }}
                />
                {[
                  { key: 'all', label: 'All' },
                  { key: 'top3', label: 'Top 3' },
                  { key: 'quick-wins', label: 'Quick Wins' },
                  { key: 'low-ctr', label: 'Low CTR' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key as any)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${filter === f.key ? c.accent : c.borderStrong}`, backgroundColor: filter === f.key ? c.accentSubtle : c.bgCardHover, color: filter === f.key ? c.accent : c.textSecondary, fontSize: 12, cursor: 'pointer', fontWeight: filter === f.key ? 600 : 400 }}
                  >
                    {f.label}
                  </button>
                ))}
                <button onClick={() => exportCSV(filteredKeywords)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${c.borderStrong}`, backgroundColor: c.bgCardHover, color: c.textSecondary, fontSize: 12, cursor: 'pointer' }}>
                  <Download size={12} /> Export
                </button>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <caption className="sr-only">SEO keyword performance data</caption>
              <thead>
                <tr>{['Keyword', 'Position', 'Impressions', 'Clicks', 'CTR', 'Signal'].map(h => (
                  <th key={h} scope="col" style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: 10, borderBottom: `1px solid ${c.borderStrong}` }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filteredKeywords.map((kw: any, i: number) => {
                  const pos = kw.position || 0;
                  const posColor = pos <= 3 ? '#059669' : pos <= 10 ? '#7C3AED' : pos <= 20 ? '#F59E0B' : '#94A3B8';
                  return (
                    <tr key={i} onMouseEnter={e => (e.currentTarget.style.backgroundColor = c.bgCardHover)} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')} style={{ borderBottom: `1px solid ${c.border}` }}>
                      <td style={{ padding: '10px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: c.text, fontWeight: 500, maxWidth: 280 }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kw.query}</div>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20,
                          fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700,
                          background: `${posColor}18`, color: posColor,
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          #{Math.round(pos)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: c.textSecondary, fontVariantNumeric: 'tabular-nums' }}>{formatNumber(kw.impressions || 0)}</td>
                      <td style={{ padding: '10px 8px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: (kw.clicks || 0) > 10 ? 700 : 500, color: c.text, fontVariantNumeric: 'tabular-nums' }}>{formatNumber(kw.clicks || 0)}</td>
                      <td style={{ padding: '10px 8px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontVariantNumeric: 'tabular-nums', color: kw.ctr < 1 && kw.impressions > 500 ? '#DC2626' : c.textSecondary }}>{(kw.ctr || 0).toFixed(1)}%</td>
                      <td style={{ padding: '10px 0' }}>
                        {kw.signal === 'top3' && (
                          <span style={{
                            display: 'inline-flex', padding: '2px 8px', borderRadius: 4,
                            fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                            background: isDark ? 'rgba(5,150,105,0.2)' : '#ECFDF5',
                            color: isDark ? '#6EE7B7' : '#065F46',
                          }}>Top 3</span>
                        )}
                        {kw.signal === 'quick-win' && (
                          <span style={{
                            display: 'inline-flex', padding: '2px 8px', borderRadius: 4,
                            fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                            background: isDark ? 'rgba(245,158,11,0.2)' : '#FFFBEB',
                            color: isDark ? '#FCD34D' : '#92400E',
                          }}>Quick Win</span>
                        )}
                        {kw.signal === 'low-ctr' && (
                          <span style={{
                            display: 'inline-flex', padding: '2px 8px', borderRadius: 4,
                            fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                            background: 'rgba(220,38,38,0.15)',
                            color: isDark ? '#FCA5A5' : '#DC2626',
                          }}>Low CTR</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredKeywords.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 0', color: c.textMuted, fontSize: 13 }}>
                No keywords match this filter
              </div>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}
