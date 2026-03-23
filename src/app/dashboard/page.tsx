'use client';
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Target, Brain, Link2, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useWorkspace, useGA4Data, useGSCData, useIntegrations } from '@/lib/hooks';
import { useRouter } from 'next/navigation';

function StatCard({ label, value, sub, color, icon: Icon, loading }: { label: string; value: string; sub?: string; color: string; icon: any; loading?: boolean }) {
  return (
    <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      {loading ? (
        <div style={{ height: 32, backgroundColor: '#27272a', borderRadius: 6, marginBottom: 8, width: '60%' }} />
      ) : (
        <div style={{ fontSize: 28, fontWeight: 800, color: '#f4f4f5', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>
          {value}
        </div>
      )}
      <div style={{ fontSize: 12, color: '#71717a' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#52525b', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { workspace, loading: wsLoading } = useWorkspace();
  const { integrations } = useIntegrations(workspace?.id);
  const { data: ga4Resp, loading: ga4Loading } = useGA4Data(workspace?.id, 'overview', 30);
  const { data: gscResp, loading: gscLoading } = useGSCData(workspace?.id, 'keywords', 30);
  const { data: gscOverviewResp } = useGSCData(workspace?.id, 'overview', 30);

  const loading = wsLoading || ga4Loading || gscLoading;

  // GA4 overview returns [{date, sessions, users, pageviews}, ...]
  const ga4Data: any[] = ga4Resp?.data || [];
  const gscKeywords: any[] = gscResp?.keywords || [];
  const gscOverview: any[] = gscOverviewResp?.overview || [];

  // Aggregate GA4 from overview objects
  const totalSessions = ga4Data.reduce((s, r) => s + (r.sessions || 0), 0);
  const totalUsers = ga4Data.reduce((s, r) => s + (r.users || 0), 0);

  // Aggregate GSC
  const totalClicks = gscKeywords.reduce((s, k) => s + (k.clicks || 0), 0);
  const totalImpressions = gscKeywords.reduce((s, k) => s + (k.impressions || 0), 0);
  const avgPosition = gscKeywords.length > 0
    ? (gscKeywords.reduce((s, k) => s + (k.position || 0), 0) / gscKeywords.length).toFixed(1) : '—';

  // Chart data from GSC overview
  const chartData = gscOverview.slice(-14).map(r => ({
    day: r.date?.slice(5) ?? '',
    clicks: r.clicks || 0,
    impressions: Math.round((r.impressions || 0) / 10),
  }));

  const connectedProviders = integrations.filter(i => i.status === 'connected').map(i => i.provider);
  const hasGA4 = connectedProviders.includes('ga4');
  const hasGSC = connectedProviders.includes('gsc');

  const quickWins = gscKeywords.filter(k => k.position >= 4 && k.position <= 10 && k.ctr < 3).slice(0, 3);
  const topKeywords = gscKeywords.slice(0, 5);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', padding: 32, fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.5px', fontFamily: 'var(--font-display)' }}>
          Welcome back{workspace?.name ? `, ${workspace.name.split(' ')[0]}` : ''}
        </h1>
        <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
          {connectedProviders.length > 0
            ? `${connectedProviders.length} source${connectedProviders.length > 1 ? 's' : ''} connected · Last 30 days`
            : 'Connect integrations to see your live data'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <StatCard
          label="Organic Sessions"
          value={hasGA4 ? totalSessions.toLocaleString() : '—'}
          sub={hasGA4 ? `${totalUsers.toLocaleString()} users` : 'Connect GA4'}
          color="#7C3AED"
          icon={BarChart3}
          loading={loading}
        />
        <StatCard
          label="Organic Clicks"
          value={hasGSC ? totalClicks.toLocaleString() : '—'}
          sub={hasGSC ? `${totalImpressions.toLocaleString()} impressions` : 'Connect GSC'}
          color="#0891B2"
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          label="Avg Position"
          value={hasGSC ? `#${avgPosition}` : '—'}
          sub={hasGSC ? `${gscKeywords.length} keywords tracked` : 'Connect GSC'}
          color="#F59E0B"
          icon={Target}
          loading={loading}
        />
        <StatCard
          label="Quick Wins"
          value={hasGSC ? `${quickWins.length}` : '—'}
          sub={hasGSC ? 'Keywords on page 1 edge' : 'Connect GSC'}
          color="#10B981"
          icon={Brain}
          loading={loading}
        />
      </div>

      <div className="two-col" style={{ marginBottom: 24 }}>
        {/* Clicks trend */}
        <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f4f4f5' }}>Organic Traffic</h2>
            <p style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>Daily clicks from Google Search (last 14 days)</p>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#F8FAFC', fontSize: 12 }} />
                <Area type="monotone" dataKey="clicks" stroke="#7C3AED" fill="url(#gDash)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <p style={{ fontSize: 14, color: '#475569' }}>No traffic data yet</p>
              <button onClick={() => router.push('/dashboard/settings')} style={{ fontSize: 12, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Connect Google Search Console →
              </button>
            </div>
          )}
        </div>

        {/* Top keywords */}
        <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f4f4f5' }}>Top Keywords</h2>
              <p style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>By organic clicks</p>
            </div>
            {hasGSC && (
              <button onClick={() => router.push('/dashboard/seo')} style={{ fontSize: 12, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer' }}>
                View all →
              </button>
            )}
          </div>
          {topKeywords.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {topKeywords.map((kw: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #27272a' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: kw.position <= 3 ? '#22c55e' : kw.position <= 10 ? '#f59e0b' : '#64748b', width: 28, flexShrink: 0 }}>
                    #{Math.round(kw.position)}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kw.query}</span>
                  <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, flexShrink: 0 }}>{kw.clicks} clicks</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <p style={{ fontSize: 14, color: '#475569' }}>No keyword data yet</p>
              <button onClick={() => router.push('/dashboard/settings')} style={{ fontSize: 12, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Sync Search Console →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connect CTA if nothing connected */}
      {connectedProviders.length === 0 && !loading && (
        <div style={{ padding: 24, borderRadius: 14, background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f4f4f5', marginBottom: 4 }}>Connect your first data source</h3>
            <p style={{ fontSize: 13, color: '#64748B' }}>Link GSC, GA4, Google Ads, or Meta Ads to populate your dashboard with real data.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/settings')}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#7C3AED', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Connect now →
          </button>
        </div>
      )}

      {/* Quick wins section */}
      {quickWins.length > 0 && (
        <div style={{ backgroundColor: '#18181b', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: 24, marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Brain size={16} color="#7C3AED" />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f4f4f5' }}>AI-Detected Quick Wins</h2>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(124,58,237,0.1)', color: '#a78bfa', fontWeight: 600 }}>ACTION NEEDED</span>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>These keywords rank positions 4-10 with low CTR. Improving titles/descriptions could push them to page 1.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickWins.map((kw: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.1)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', width: 30 }}>#{Math.round(kw.position)}</span>
                <span style={{ flex: 1, fontSize: 13, color: '#a1a1aa' }}>{kw.query}</span>
                <span style={{ fontSize: 12, color: '#64748B' }}>{kw.impressions.toLocaleString()} impressions</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>{kw.ctr.toFixed(1)}% CTR</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
