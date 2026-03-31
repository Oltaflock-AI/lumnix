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
  const { c } = useTheme();
  const { workspace, loading: wsLoading } = useWorkspaceCtx();
  const workspaceId = workspace?.id;

  const { data: kwResp, loading: kwLoading } = useGSCData(workspaceId, 'keywords', days);
  const { data: overviewResp, loading: overviewLoading } = useGSCData(workspaceId, 'overview', days);

  const loading = wsLoading || kwLoading || overviewLoading;

  const allKeywords: any[] = kwResp?.keywords || [];
  const overviewData: any[] = overviewResp?.overview || [];

  const hasData = allKeywords.length > 0;

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
    { label: '#1-3', count: top3, color: c.success },
    { label: '#4-10', count: top10, color: c.accent },
    { label: '#11-20', count: top20, color: c.warning },
    { label: '20+', count: beyond, color: '#6b7280' },
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

      {!loading && !hasData && (
        <EmptyState
          icon={Search}
          title={days <= 14 ? "No data for this date range" : "No GSC data yet"}
          description={days <= 14
            ? "No GSC data found for the selected period. Your data may not cover this range — try syncing fresh data."
            : "Connect and sync Google Search Console in Settings to see keyword intelligence here."
          }
          actionLabel={days <= 14 ? (syncing ? "Syncing..." : "Sync Now") : "Go to Settings"}
          onAction={() => {
            if (days <= 14) {
              setSyncing(true);
              fetch('/api/sync/gsc', { method: 'POST' })
                .then(() => window.location.reload())
                .catch(err => console.error('Sync failed:', err))
                .finally(() => setSyncing(false));
            } else {
              router.push('/dashboard/settings');
            }
          }}
        />
      )}

      {!loading && hasData && (
        <>
          {/* KPIs */}
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total Clicks', value: totalClicks.toLocaleString(), icon: TrendingUp, color: c.accent, sub: `${days}d period` },
              { label: 'Impressions', value: totalImpressions.toLocaleString(), icon: Eye, color: '#3b82f6', sub: 'Search appearances' },
              { label: 'Avg CTR', value: `${avgCTR}%`, icon: Target, color: c.success, sub: top3 > 0 ? `${top3} keywords in top 3` : 'Improve titles' },
              { label: 'Avg Position', value: avgPosition, icon: Search, color: c.warning, sub: `${keywords.length} keywords tracked` },
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

          {/* Position distribution + Quick wins */}
          <div className="two-col-equal" style={{ marginBottom: 20 }}>
            <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 4 }}>Ranking Distribution</h2>
              <p style={{ fontSize: 12, color: c.textMuted, marginBottom: 16 }}>How many keywords rank in each position bucket</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={bucketData} barCategoryGap="30%">
                  <XAxis dataKey="label" stroke={c.border} tick={{ fill: c.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke={c.border} tick={{ fill: c.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {bucketData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                {bucketData.map(b => (
                  <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: b.color }} />
                    <span style={{ fontSize: 11, color: c.textSecondary }}>{b.label}: {b.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick wins */}
            <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.accentSubtle}`, borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Zap size={16} color={c.accent} />
                <h2 style={{ fontSize: 16, fontWeight: 600, color: c.text }}>Quick Wins</h2>
              </div>
              <p style={{ fontSize: 12, color: c.textMuted, marginBottom: 16 }}>Positions 4-10 with low CTR — improve titles to jump to page 1</p>
              {quickWins.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: c.textMuted, fontSize: 13 }}>
                  No quick wins found — your CTRs look healthy!
                </div>
              ) : quickWins.map(kw => (
                <div key={kw.query} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: `1px solid ${c.border}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: c.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: c.accent, fontFamily: 'var(--font-mono)' }}>
                    {Math.round(kw.position)}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, color: c.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kw.query}</span>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: c.danger, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{kw.ctr.toFixed(1)}% CTR</div>
                    <div style={{ fontSize: 11, color: c.textMuted, fontFamily: 'var(--font-mono)' }}>{kw.impressions.toLocaleString()} impr</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clicks trend */}
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 4 }}>Organic Clicks Trend</h2>
            <p style={{ fontSize: 12, color: c.textMuted, marginBottom: 16 }}>Daily organic clicks from Google Search</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.accent} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke={c.border} tick={{ fill: c.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis stroke={c.border} tick={{ fill: c.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="clicks" stroke={c.accent} fill="url(#gClicks)" strokeWidth={2} dot={false} />
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
                  style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${c.borderStrong}`, backgroundColor: c.bgCardHover, color: c.text, fontSize: 13, outline: 'none', width: 180 }}
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
              <thead>
                <tr>{['Keyword', 'Position', 'Impressions', 'Clicks', 'CTR', 'Signal'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: 10, borderBottom: `1px solid ${c.borderStrong}` }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filteredKeywords.map((kw: any, i: number) => (
                  <tr key={i} onMouseEnter={e => (e.currentTarget.style.backgroundColor = c.bgCardHover)} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')} style={{ borderBottom: `1px solid ${c.border}` }}>
                    <td style={{ padding: '10px 0', fontSize: 13, color: c.text, fontWeight: 500, maxWidth: 280 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kw.query}</div>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: kw.position <= 3 ? c.success : kw.position <= 10 ? c.warning : c.textSecondary }}>
                        #{Math.round(kw.position)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: 13, color: c.textSecondary, fontFamily: 'var(--font-mono)' }}>{(kw.impressions || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 8px', fontSize: 13, fontWeight: 600, color: c.text, fontFamily: 'var(--font-mono)' }}>{(kw.clicks || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 8px', fontSize: 13, fontFamily: 'var(--font-mono)', color: kw.ctr < 1 && kw.impressions > 500 ? c.danger : c.textSecondary }}>{(kw.ctr || 0).toFixed(1)}%</td>
                    <td style={{ padding: '10px 0' }}>
                      {kw.signal === 'top3' && <InsightPill color={c.success} label="Top 3" />}
                      {kw.signal === 'quick-win' && <InsightPill color={c.accent} label="Quick Win" />}
                      {kw.signal === 'low-ctr' && <InsightPill color={c.warning} label="Low CTR" />}
                    </td>
                  </tr>
                ))}
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
