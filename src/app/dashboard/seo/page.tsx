'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, TrendingDown, AlertTriangle, Download, Zap, Star, Target, Eye } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useGSCData } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/format';
import { Sparkline } from '@/components/Sparkline';

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

function LxSparkline({ color, gradientId, direction = 'up', data, ariaLabel }: { color: string; gradientId: string; direction?: 'up' | 'down'; data?: (number | null | undefined)[]; ariaLabel?: string }) {
  void gradientId;
  void direction;
  return (
    <Sparkline
      data={data || []}
      color={color}
      className="lx-sparkline"
      ariaLabel={ariaLabel}
    />
  );
}

function PositionBadge({ pos }: { pos: number }) {
  const cls = pos <= 3 ? 'lx-position-badge--top3' : pos <= 10 ? 'lx-position-badge--top10' : 'lx-position-badge--top20';
  return <span className={`lx-position-badge ${cls}`}>{Math.round(pos)}</span>;
}

function MiniSparkline({ color = '#10B981', data }: { color?: string; data?: (number | null | undefined)[] }) {
  return (
    <Sparkline
      data={data || []}
      color={color}
      width={60}
      height={20}
      fill={false}
      className="lx-mini-sparkline"
      ariaLabel="Keyword trend"
    />
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

  const avgCTRValue = useMemo(
    () => allKeywords.length > 0 ? allKeywords.reduce((s, k) => s + k.ctr, 0) / allKeywords.length : 0,
    [allKeywords]
  );

  const keywords = useMemo(() => allKeywords.map(kw => ({
    ...kw,
    signal: kw.position <= 3 ? 'top3'
      : (kw.position >= 4 && kw.position <= 10 && kw.ctr < avgCTRValue * 0.7) ? 'quick-win'
      : (kw.impressions > 500 && kw.ctr < 1) ? 'low-ctr'
      : '',
  })), [allKeywords, avgCTRValue]);

  const { totalClicks, totalImpressions, avgCTR, avgPosition, top3, top10, top20, beyond } = useMemo(() => {
    const clicks = keywords.reduce((s, r) => s + (r.clicks || 0), 0);
    const impressions = keywords.reduce((s, r) => s + (r.impressions || 0), 0);
    return {
      totalClicks: clicks,
      totalImpressions: impressions,
      avgCTR: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0',
      avgPosition: keywords.length > 0 ? (keywords.reduce((s, r) => s + (r.position || 0), 0) / keywords.length).toFixed(1) : '0',
      top3: keywords.filter(k => k.position <= 3).length,
      top10: keywords.filter(k => k.position > 3 && k.position <= 10).length,
      top20: keywords.filter(k => k.position > 10 && k.position <= 20).length,
      beyond: keywords.filter(k => k.position > 20).length,
    };
  }, [keywords]);

  const bucketData = useMemo(() => [
    { label: '#1-3', count: top3, color: '#10B981' },
    { label: '#4-10', count: top10, color: '#3B82F6' },
    { label: '#11-20', count: top20, color: '#F59E0B' },
    { label: '20+', count: beyond, color: '#6B7280' },
  ], [top3, top10, top20, beyond]);

  const totalTracked = top3 + top10 + top20 + beyond;
  const pct = (n: number) => totalTracked > 0 ? Math.round((n / totalTracked) * 100) : 0;

  const quickWins = useMemo(
    () => keywords.filter(k => k.position >= 4 && k.position <= 10 && k.ctr < avgCTRValue * 0.7).slice(0, 5),
    [keywords, avgCTRValue]
  );

  const filteredKeywords = useMemo(() => {
    const q = search.toLowerCase();
    return keywords
      .filter(k => {
        if (filter === 'quick-wins') return k.position >= 4 && k.position <= 10 && k.ctr < avgCTRValue * 0.7;
        if (filter === 'top3') return k.position <= 3;
        if (filter === 'low-ctr') return k.impressions > 500 && k.ctr < 1;
        return true;
      })
      .filter(k => !q || k.query.toLowerCase().includes(q))
      .slice(0, 50);
  }, [keywords, filter, search, avgCTRValue]);

  const trendData = useMemo(() => overviewData.slice(-14).map(r => ({
    day: r.date?.slice(5) ?? '',
    clicks: r.clicks || 0,
    impressions: (r.impressions || 0) / 10,
  })), [overviewData]);

  const dailyClicks = useMemo(() => overviewData.map((r: any) => r.clicks || 0), [overviewData]);
  const dailyImpressions = useMemo(() => overviewData.map((r: any) => r.impressions || 0), [overviewData]);
  const dailyPosition = useMemo(() => overviewData.map((r: any) => r.position || 0), [overviewData]);
  const dailyCTR = useMemo(() => overviewData.map((r: any) => (r.ctr || 0) * 100), [overviewData]);

  const tooltipStyle = useMemo(
    () => ({ backgroundColor: c.bgCard, border: `1px solid ${c.borderStrong}`, borderRadius: 8, color: c.text, fontSize: 12 }),
    [c.bgCard, c.borderStrong, c.text]
  );

  return (
    <PageShell title="SEO Intelligence" description="Google Search Console data — insights beyond native GSC" icon={Search}>
      <div className="lx-welcome" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>SEO <span>Performance</span></h1>
          <div className="lx-welcome-sub">
            <span className="lx-welcome-dot"></span>
            Google Search Console synced{hasData ? ` • ${keywords.length} keywords tracked` : ''}
          </div>
        </div>
        <DateRangePicker value={days} onChange={setDays} />
      </div>

      {loading && (
        <>
          <div className="lx-kpi-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="lx-kpi-card" style={{ minHeight: 140 }}>
                <Skeleton style={{ height: 14, width: '50%', marginBottom: 12 }} />
                <Skeleton style={{ height: 28, width: '70%', marginBottom: 10 }} />
                <Skeleton style={{ height: 40, width: '100%' }} />
              </div>
            ))}
          </div>
          <div className="lx-card" style={{ marginBottom: 24 }}>
            <Skeleton style={{ height: 250, width: '100%' }} />
          </div>
        </>
      )}

      {!loading && !hasData && hasSyncedBefore && (
        <div className="lx-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
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
          {/* KPI GRID */}
          <div className="lx-kpi-grid">
            <div className="lx-kpi-card">
              <div className="lx-kpi-top">
                <span className="lx-kpi-label">Total Clicks</span>
                <div className="lx-icon-pill lx-icon-pill--gsc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </div>
              </div>
              <div className="lx-kpi-value">{totalClicks != null ? formatNumber(totalClicks) : '—'}</div>
              <LxSparkline color="var(--primary)" gradientId="sparkClicks" direction="up" data={dailyClicks} ariaLabel="Daily clicks trend" />
              <div className="lx-kpi-footer">
                <span className="lx-pill lx-pill--muted">{days}d period</span>
                <span className="lx-kpi-compare">GSC</span>
              </div>
            </div>

            <div className="lx-kpi-card">
              <div className="lx-kpi-top">
                <span className="lx-kpi-label">Impressions</span>
                <div className="lx-icon-pill lx-icon-pill--gsc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                </div>
              </div>
              <div className="lx-kpi-value">{totalImpressions != null ? formatNumber(totalImpressions) : '—'}</div>
              <LxSparkline color="var(--secondary)" gradientId="sparkImpr" direction="up" data={dailyImpressions} ariaLabel="Daily impressions trend" />
              <div className="lx-kpi-footer">
                <span className="lx-pill lx-pill--muted">Search appearances</span>
                <span className="lx-kpi-compare">GSC</span>
              </div>
            </div>

            <div className="lx-kpi-card">
              <div className="lx-kpi-top">
                <span className="lx-kpi-label">Avg Position</span>
                <div className="lx-icon-pill lx-icon-pill--gsc">
                  <Target size={18} color="#4285F4" aria-hidden="true" />
                </div>
              </div>
              <div className="lx-kpi-value">{avgPosition || '—'}</div>
              <LxSparkline color="var(--primary)" gradientId="sparkPos" direction="down" data={dailyPosition} ariaLabel="Daily average position trend" />
              <div className="lx-kpi-footer">
                <span className="lx-pill lx-pill--muted">{keywords.length} keywords</span>
                <span className="lx-kpi-compare">lower is better</span>
              </div>
            </div>

            <div className="lx-kpi-card">
              <div className="lx-kpi-top">
                <span className="lx-kpi-label">CTR</span>
                <div className="lx-icon-pill lx-icon-pill--gsc">
                  <Star size={18} color="#4285F4" aria-hidden="true" />
                </div>
              </div>
              <div className="lx-kpi-value">{avgCTR !== '0' ? `${avgCTR}%` : '—'}</div>
              <LxSparkline color="var(--secondary)" gradientId="sparkCTR" direction="up" data={dailyCTR} ariaLabel="Daily CTR trend" />
              <div className="lx-kpi-footer">
                <span className="lx-pill lx-pill--muted">{top3} in top 3</span>
                <span className="lx-kpi-compare">click-through rate</span>
              </div>
            </div>
          </div>

          {/* CLICKS & IMPRESSIONS TREND */}
          <div className="lx-card" style={{ marginBottom: 24 }}>
            <div className="lx-card-header">
              <span className="lx-card-title">Clicks &amp; Impressions Trend</span>
              <span className="lx-pill lx-pill--info">Dual-axis</span>
            </div>
            <div className="lx-chart-area" style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gClicksSeo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF0066" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#FF0066" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gImprSeo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="impressions" stroke="#00D4AA" fill="url(#gImprSeo)" strokeWidth={2.5} dot={false} />
                  <Area type="monotone" dataKey="clicks" stroke="#FF0066" fill="url(#gClicksSeo)" strokeWidth={3} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="lx-chart-legend">
              <span className="lx-legend-item"><span className="lx-legend-dot" style={{ background: '#FF0066' }}></span>Clicks</span>
              <span className="lx-legend-item"><span className="lx-legend-dot" style={{ background: '#00D4AA' }}></span>Impressions</span>
            </div>
          </div>

          {/* TOP KEYWORDS + POSITION DISTRIBUTION */}
          <div className="lx-grid-60-40" style={{ marginBottom: 24 }}>
            <div className="lx-card">
              <div className="lx-card-header">
                <span className="lx-card-title">Top Keywords</span>
                {quickWins.length > 0 && <span className="lx-pill lx-pill--warning"><Zap size={11} /> {quickWins.length} quick wins</span>}
              </div>
              <table className="lx-table">
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Position</th>
                    <th>Clicks</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.slice(0, 8).map((kw: any, i: number) => (
                    <tr key={i}>
                      <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kw.query}</td>
                      <td><PositionBadge pos={kw.position || 0} /></td>
                      <td>{formatNumber(kw.clicks || 0)}</td>
                      <td><MiniSparkline color={kw.position <= 3 ? '#10B981' : kw.position <= 10 ? '#3B82F6' : '#F59E0B'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lx-card">
              <div className="lx-card-header">
                <span className="lx-card-title">Position Distribution</span>
                <span className="lx-pill lx-pill--info">All keywords</span>
              </div>
              <div style={{ marginTop: 8 }}>
                {[
                  { label: 'Positions 1-3', count: top3, color: 'linear-gradient(90deg, #10B981, #059669)' },
                  { label: 'Positions 4-10', count: top10, color: 'linear-gradient(90deg, #3B82F6, #1E40AF)' },
                  { label: 'Positions 11-20', count: top20, color: 'linear-gradient(90deg, #F59E0B, #D97706)' },
                  { label: 'Position 20+', count: beyond, color: 'linear-gradient(90deg, #6B7280, #4B5563)' },
                ].map((row, idx) => {
                  const p = pct(row.count);
                  return (
                    <div key={row.label} style={{ marginTop: idx === 0 ? 0 : 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: c.text, marginBottom: 4 }}>{row.label}</div>
                      <div className="lx-stacked-bar-row">
                        <div className="lx-stacked-segment" style={{ flex: `0 0 ${Math.max(p, 2)}%`, background: row.color }}></div>
                        <div className="lx-stacked-segment" style={{ flex: `0 0 ${100 - Math.max(p, 2)}%`, background: 'rgba(255,255,255,0.05)' }}></div>
                      </div>
                      <div className="lx-stacked-label">{p}% of keywords ({row.count} total)</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ALL KEYWORDS TABLE */}
          <div className="lx-card" style={{ marginBottom: 24 }}>
            <div className="lx-card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
              <span className="lx-card-title">All Keywords</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search keywords..."
                  style={{
                    height: 32, padding: '0 10px', borderRadius: 8,
                    border: `1px solid ${c.border}`, backgroundColor: c.bgCardHover, color: c.text,
                    fontSize: 12, width: 180, outline: 'none',
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
                    className={filter === f.key ? 'lx-btn-primary' : 'lx-btn-outline'}
                    style={{ fontSize: 12 }}
                  >
                    {f.label}
                  </button>
                ))}
                <button onClick={() => exportCSV(filteredKeywords)} className="lx-btn-outline" style={{ fontSize: 12 }}>
                  <Download size={12} /> Export
                </button>
              </div>
            </div>

            <table className="lx-table">
              <caption className="sr-only">SEO keyword performance data</caption>
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Position</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>Signal</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeywords.map((kw: any, i: number) => {
                  const pos = kw.position || 0;
                  return (
                    <tr key={i}>
                      <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kw.query}</td>
                      <td><PositionBadge pos={pos} /></td>
                      <td>{formatNumber(kw.impressions || 0)}</td>
                      <td style={{ fontWeight: (kw.clicks || 0) > 10 ? 700 : 500 }}>{formatNumber(kw.clicks || 0)}</td>
                      <td style={{ color: kw.ctr < 1 && kw.impressions > 500 ? 'var(--danger)' : undefined }}>
                        {(kw.ctr || 0).toFixed(1)}%
                      </td>
                      <td>
                        {kw.signal === 'top3' && <span className="lx-pill lx-pill--success">Top 3</span>}
                        {kw.signal === 'quick-win' && <span className="lx-pill lx-pill--warning">Quick Win</span>}
                        {kw.signal === 'low-ctr' && <span className="lx-pill lx-pill--danger">Low CTR</span>}
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
