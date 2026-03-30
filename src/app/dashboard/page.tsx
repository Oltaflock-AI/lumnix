'use client';
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Brain, Sparkles, AlertTriangle, Lightbulb, Zap, ArrowRight, Bell, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useWorkspace, useGA4Data, useGSCData, useIntegrations } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme';

// Platform logos via SimpleIcons CDN
const PlatformLogo = ({ name, size = 18 }: { name: string; size?: number }) => (
  <img src={`https://cdn.simpleicons.org/${name}`} width={size} height={size} alt={name} style={{ flexShrink: 0 }} />
);

function StatCard({ label, value, sub, color, icon: Icon, loading, platformLogo }: {
  label: string; value: string; sub?: string; color: string; icon: any; loading?: boolean; platformLogo?: string;
}) {
  const { c } = useTheme();
  return (
    <div style={{ backgroundColor: c.bgCard, borderRadius: 14, padding: 24, boxShadow: c.shadow }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        {platformLogo && <PlatformLogo name={platformLogo} size={15} />}
      </div>
      {loading ? (
        <div style={{ height: 36, backgroundColor: c.bgTag, borderRadius: 6, marginBottom: 8, width: '55%', animation: 'pulse 1.5s ease-in-out infinite' }} />
      ) : (
        <div style={{ fontSize: 32, fontWeight: 600, color: c.text, letterSpacing: '-0.03em', marginBottom: 4, lineHeight: 1.1 }}>
          {value}
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 500, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: c.textMuted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { c } = useTheme();
  const { workspace, loading: wsLoading } = useWorkspaceCtx();
  const { integrations } = useIntegrations(workspace?.id);
  const { data: ga4Resp, loading: ga4Loading } = useGA4Data(workspace?.id, 'overview', 30);
  const { data: gscResp, loading: gscLoading } = useGSCData(workspace?.id, 'keywords', 30);
  const { data: gscOverviewResp } = useGSCData(workspace?.id, 'overview', 30);

  const loading = wsLoading || ga4Loading || gscLoading;

  const ga4Data: any[] = ga4Resp?.data || [];
  const gscKeywords: any[] = gscResp?.keywords || [];
  const gscOverview: any[] = gscOverviewResp?.overview || [];

  const totalSessions = ga4Data.reduce((s, r) => s + (r.sessions || 0), 0);
  const totalUsers = ga4Data.reduce((s, r) => s + (r.users || 0), 0);
  const totalClicks = gscKeywords.reduce((s, k) => s + (k.clicks || 0), 0);
  const totalImpressions = gscKeywords.reduce((s, k) => s + (k.impressions || 0), 0);
  const avgPosition = gscKeywords.length > 0
    ? (gscKeywords.reduce((s, k) => s + (k.position || 0), 0) / gscKeywords.length).toFixed(1) : '—';

  const chartData = gscOverview.slice(-14).map(r => ({
    day: r.date?.slice(5) ?? '',
    clicks: r.clicks || 0,
  }));

  const connectedProviders = integrations.filter(i => i.status === 'connected').map(i => i.provider);
  const hasGA4 = connectedProviders.includes('ga4');
  const hasGSC = connectedProviders.includes('gsc');
  const quickWins = gscKeywords.filter(k => k.position >= 4 && k.position <= 10 && k.ctr < 3).slice(0, 3);
  const topKeywords = gscKeywords.slice(0, 5);

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>

      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: c.text, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
          Welcome back{workspace?.name ? `, ${workspace.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p style={{ color: c.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>
          {connectedProviders.length > 0
            ? `${connectedProviders.length} data source${connectedProviders.length > 1 ? 's' : ''} connected · Last 30 days`
            : 'Connect your first integration to see live data'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Organic Sessions" value={hasGA4 ? totalSessions.toLocaleString() : '—'} sub={hasGA4 ? `${totalUsers.toLocaleString()} users` : 'Connect GA4'} color="#7C3AED" icon={BarChart3} loading={loading} platformLogo="googleanalytics" />
        <StatCard label="Organic Clicks" value={hasGSC ? totalClicks.toLocaleString() : '—'} sub={hasGSC ? `${totalImpressions.toLocaleString()} impressions` : 'Connect GSC'} color="#0891B2" icon={TrendingUp} loading={loading} platformLogo="googlesearchconsole" />
        <StatCard label="Avg Position" value={hasGSC ? `#${avgPosition}` : '—'} sub={hasGSC ? `${gscKeywords.length} keywords tracked` : 'Connect GSC'} color="#F59E0B" icon={Target} loading={loading} />
        <StatCard label="Quick Wins" value={hasGSC ? `${quickWins.length}` : '—'} sub={hasGSC ? 'Page 1 edge keywords' : 'Connect GSC'} color="#10B981" icon={Brain} loading={loading} />
      </div>

      {/* Charts row */}
      <div className="two-col" style={{ marginBottom: 24 }}>
        {/* Clicks chart */}
        <div style={{ backgroundColor: c.bgCard, borderRadius: 14, padding: 24, boxShadow: c.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <PlatformLogo name="googlesearchconsole" size={15} />
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Organic Traffic</p>
              <p style={{ fontSize: 12, color: c.textMuted, marginTop: 1 }}>Daily clicks — last 14 days</p>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="transparent" tick={{ fill: c.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis stroke="transparent" tick={{ fill: c.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 8, color: c.text, fontSize: 12, boxShadow: c.shadow }} />
                <Area type="monotone" dataKey="clicks" stroke="#7C3AED" fill="url(#gDash)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <p style={{ fontSize: 14, color: c.textMuted }}>No traffic data yet</p>
              <button onClick={() => router.push('/dashboard/settings')} style={{ fontSize: 13, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Connect Google Search Console →
              </button>
            </div>
          )}
        </div>

        {/* Top keywords */}
        <div style={{ backgroundColor: c.bgCard, borderRadius: 14, padding: 24, boxShadow: c.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlatformLogo name="googlesearchconsole" size={15} />
              <div>
                <p style={{ fontSize: 11, fontWeight: 500, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Top Keywords</p>
                <p style={{ fontSize: 12, color: c.textMuted, marginTop: 1 }}>By organic clicks</p>
              </div>
            </div>
            {hasGSC && (
              <button onClick={() => router.push('/dashboard/seo')} style={{ fontSize: 12, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                View all →
              </button>
            )}
          </div>
          {topKeywords.length > 0 ? (
            <div>
              {topKeywords.map((kw: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < topKeywords.length - 1 ? `1px solid ${c.borderSubtle}` : 'none' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: kw.position <= 3 ? '#10B981' : kw.position <= 10 ? '#F59E0B' : c.textMuted, width: 28, flexShrink: 0 }}>
                    #{Math.round(kw.position)}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: c.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kw.query}</span>
                  <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, flexShrink: 0 }}>{kw.clicks}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <p style={{ fontSize: 14, color: c.textMuted }}>No keyword data yet</p>
              <button onClick={() => router.push('/dashboard/settings')} style={{ fontSize: 13, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Sync Search Console →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connect CTA */}
      {connectedProviders.length === 0 && !loading && (
        <div style={{ padding: 20, borderRadius: 14, background: '#F5F3FF', boxShadow: '0 0 0 1px rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 3 }}>Connect your first data source</h3>
            <p style={{ fontSize: 13, color: '#64748B' }}>Link GSC, GA4, Google Ads, or Meta Ads to populate your dashboard with real data.</p>
          </div>
          <button onClick={() => router.push('/dashboard/settings')} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#7C3AED', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
            Connect now →
          </button>
        </div>
      )}

      {/* Quick wins */}
      {quickWins.length > 0 && (
        <div style={{ backgroundColor: c.bgCard, borderRadius: 14, padding: 24, boxShadow: c.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Brain size={16} color="#7C3AED" />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Quick Wins</h3>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>ACTION NEEDED</span>
          </div>
          <p style={{ fontSize: 13, color: c.textSecondary, marginBottom: 14, lineHeight: 1.6 }}>These keywords rank positions 4–10 with low CTR. Improving title tags could push them to page 1.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickWins.map((kw: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, backgroundColor: c.bgTag, border: `1px solid ${c.borderSubtle}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', width: 30 }}>#{Math.round(kw.position)}</span>
                <span style={{ flex: 1, fontSize: 13, color: c.textSecondary }}>{kw.query}</span>
                <span style={{ fontSize: 12, color: c.textMuted }}>{kw.impressions?.toLocaleString()} impr.</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#EF4444' }}>{kw.ctr?.toFixed(1)}% CTR</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies widget */}
      <AnomaliesWidget workspaceId={workspace?.id} />

      {/* AI Insights widget */}
      <AIInsightsWidget workspaceId={workspace?.id} />
    </div>
  );
}

/* ─── Anomalies Dashboard Widget ─── */

const SEVERITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#eab308',
};

const SEVERITY_BG: Record<string, string> = {
  high: 'rgba(239,68,68,0.12)',
  medium: 'rgba(245,158,11,0.12)',
  low: 'rgba(234,179,8,0.12)',
};

function AnomaliesWidget({ workspaceId }: { workspaceId: string | undefined }) {
  const { c } = useTheme();
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    fetch(`/api/anomalies?workspace_id=${workspaceId}`)
      .then(r => r.json())
      .then(data => setAnomalies(data.anomalies || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  async function markAsRead(id: string) {
    await fetch(`/api/anomalies/${id}/read`, { method: 'POST' });
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
  }

  if (loading) return null;

  const unread = anomalies.filter(a => !a.is_read);

  return (
    <div style={{ backgroundColor: c.bgCard, borderRadius: 14, padding: 24, boxShadow: c.shadow, marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} color="#ef4444" />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Anomalies</h3>
          {unread.length > 0 && (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700 }}>
              {unread.length} new
            </span>
          )}
        </div>
      </div>

      {anomalies.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0' }}>
          <CheckCircle size={16} color="#22c55e" />
          <p style={{ fontSize: 13, color: c.textSecondary }}>No anomalies detected — everything looks healthy</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {anomalies.slice(0, 5).map((anomaly: any) => {
            const severityColor = SEVERITY_COLORS[anomaly.severity] || '#eab308';
            const severityBg = SEVERITY_BG[anomaly.severity] || 'rgba(234,179,8,0.12)';
            return (
              <div
                key={anomaly.id}
                onClick={() => !anomaly.is_read && markAsRead(anomaly.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 8,
                  backgroundColor: anomaly.is_read ? c.bgTag : severityBg,
                  border: `1px solid ${anomaly.is_read ? c.borderSubtle : severityColor}30`,
                  cursor: anomaly.is_read ? 'default' : 'pointer',
                  opacity: anomaly.is_read ? 0.7 : 1,
                }}
              >
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6,
                  backgroundColor: severityBg, color: severityColor, flexShrink: 0, marginTop: 2,
                }}>
                  {anomaly.severity}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 3 }}>{anomaly.title}</p>
                  <p style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.5 }}>{anomaly.description}</p>
                  {anomaly.affected_pages && anomaly.affected_pages.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {anomaly.affected_pages.slice(0, 3).map((page: string, i: number) => (
                        <span key={i} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: c.bgTag, color: c.textMuted, border: `1px solid ${c.borderSubtle}` }}>
                          {page.length > 40 ? page.slice(0, 40) + '...' : page}
                        </span>
                      ))}
                      {anomaly.affected_pages.length > 3 && (
                        <span style={{ fontSize: 11, color: c.textMuted }}>+{anomaly.affected_pages.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
                {!anomaly.is_read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: severityColor, flexShrink: 0, marginTop: 5 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── AI Insights Dashboard Widget ─── */

const INSIGHT_DOT_COLORS: Record<string, string> = {
  win: '#22c55e',
  warning: '#ef4444',
  opportunity: '#f59e0b',
  tip: '#3b82f6',
};

const INSIGHT_ICONS: Record<string, any> = {
  win: TrendingUp,
  warning: AlertTriangle,
  opportunity: Lightbulb,
  tip: Zap,
};

function AIInsightsWidget({ workspaceId }: { workspaceId: string | undefined }) {
  const { c } = useTheme();
  const router = useRouter();
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    fetch(`/api/insights?workspace_id=${workspaceId}`)
      .then(r => r.json())
      .then(data => setInsights(data.insights || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  async function generate() {
    if (!workspaceId) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/insights/generate', {
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

  // Sort by priority (high first)
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const top3 = [...insights].sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)).slice(0, 3);

  if (loading) return null;

  return (
    <div style={{ backgroundColor: c.bgCard, borderRadius: 14, padding: 24, boxShadow: c.shadow, marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#7C3AED" />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: c.text }}>AI Insights</h3>
        </div>
        <button
          onClick={() => router.push('/dashboard/ai')}
          style={{ fontSize: 12, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          View all insights <ArrowRight size={12} />
        </button>
      </div>

      {top3.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
          <p style={{ fontSize: 13, color: c.textSecondary }}>No insights generated yet. Let AI analyze your marketing data.</p>
          <button
            onClick={generate}
            disabled={generating}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', fontSize: 13, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1, whiteSpace: 'nowrap' }}
          >
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {top3.map((insight: any) => {
            const Icon = INSIGHT_ICONS[insight.type] || Zap;
            const dotColor = INSIGHT_DOT_COLORS[insight.type] || '#3b82f6';
            return (
              <div key={insight.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, backgroundColor: c.bgTag, border: `1px solid ${c.borderSubtle}` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 2 }}>{insight.title}</p>
                  <p style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{insight.description}</p>
                </div>
                <Icon size={14} color={dotColor} style={{ flexShrink: 0, marginTop: 3 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
