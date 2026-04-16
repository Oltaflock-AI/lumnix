'use client';
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { BarChart3, TrendingUp, Target, Brain, Sparkles, AlertTriangle, Lightbulb, Zap, ArrowRight, CheckCircle, FileText, Users, Search, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useGA4Data, useGSCData, useIntegrations, useUnifiedData } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatINRCompact, formatROAS } from '@/lib/format';
import { apiFetch } from '@/lib/api-fetch';
import { supabase } from '@/lib/supabase';

const PlatformLogo = ({ name, size = 18 }: { name: string; size?: number }) => (
  <img src={`https://cdn.simpleicons.org/${name}`} width={size} height={size} alt={name} style={{ flexShrink: 0 }} />
);

function StatCard({ label, value, sub, color, icon: Icon, loading, platformLogo, change }: {
  label: string; value: string; sub?: string; color: string; icon: any; loading?: boolean; platformLogo?: string; change?: string;
}) {
  const { c } = useTheme();
  return (
    <div style={{
      backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 14,
      padding: '22px 24px', boxShadow: c.shadow,
      transition: 'all 0.2s cubic-bezier(0.23,1,0.32,1)', position: 'relative', overflow: 'hidden',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.08)';
      e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = c.shadow;
      e.currentTarget.style.borderColor = c.border;
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      {/* Gradient top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}, ${color}80)`,
        borderRadius: '14px 14px 0 0',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `linear-gradient(135deg, ${color}15, ${color}08)`,
          border: `1px solid ${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {platformLogo ? <PlatformLogo name={platformLogo} size={16} /> : <Icon size={16} color={color} />}
        </div>
        {change && !loading && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: change.startsWith('+') ? '#059669' : change.startsWith('-') ? '#DC2626' : c.textSecondary,
            backgroundColor: change.startsWith('+') ? 'rgba(5,150,105,0.08)' : change.startsWith('-') ? 'rgba(220,38,38,0.08)' : 'transparent',
            padding: '3px 8px', borderRadius: 6,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {change.startsWith('+') ? '▲ ' : change.startsWith('-') ? '▼ ' : ''}{change}
          </span>
        )}
      </div>

      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>

      {loading ? (
        <div style={{ marginTop: 8 }}>
          <Skeleton className="h-9 w-[55%] mb-2" />
          <Skeleton className="h-3 w-[35%]" />
        </div>
      ) : (() => {
        const isEmpty = value === '—' || value === '0' || value === '₹0';
        return (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: isEmpty ? '#A09CC0' : c.text, lineHeight: 1, fontFamily: "'Plus Jakarta Sans', var(--font-display), sans-serif", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
              {isEmpty ? '—' : value}
            </div>
          </div>
        );
      })()}
      {sub && <div style={{ fontSize: 12, color: c.textMuted, marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>{(() => { const isEmpty = value === '—' || value === '0' || value === '₹0'; return isEmpty && !sub.includes('Connect') ? 'No data yet' : sub; })()}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { c } = useTheme();
  const { workspace, loading: wsLoading } = useWorkspaceCtx();
  const [days, setDays] = useState(30);
  const { integrations } = useIntegrations(workspace?.id);
  const { data: ga4Resp, loading: ga4Loading } = useGA4Data(workspace?.id, 'overview', days);
  const { data: gscResp, loading: gscLoading } = useGSCData(workspace?.id, 'keywords', days);
  const { data: gscOverviewResp } = useGSCData(workspace?.id, 'overview', days);
  const { data: unifiedResp, loading: unifiedLoading } = useUnifiedData(workspace?.id, days);

  // Get user's first name for greeting — single call on mount, session already cached
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

  const loading = wsLoading || ga4Loading || gscLoading || unifiedLoading;

  const ga4Data: any[] = Array.isArray(ga4Resp?.data) ? ga4Resp.data : [];
  const gscKeywords: any[] = Array.isArray(gscResp?.keywords) ? gscResp.keywords : [];
  const gscOverview: any[] = Array.isArray(gscOverviewResp?.overview) ? gscOverviewResp.overview : [];
  const unifiedDaily: any[] = Array.isArray(unifiedResp?.daily) ? unifiedResp.daily : [];
  const uTotals = (unifiedResp?.totals && typeof unifiedResp.totals === 'object') ? unifiedResp.totals : {};

  // Memoized aggregations — avoid reducing large arrays on every render
  const { totalSessions, totalUsers } = useMemo(() => ({
    totalSessions: ga4Data.reduce((s, r) => s + (r.sessions || 0), 0),
    totalUsers: ga4Data.reduce((s, r) => s + (r.users || 0), 0),
  }), [ga4Data]);

  const { totalClicks, totalImpressions } = useMemo(() => ({
    totalClicks: gscKeywords.reduce((s, k) => s + (k.clicks || 0), 0),
    totalImpressions: gscKeywords.reduce((s, k) => s + (k.impressions || 0), 0),
  }), [gscKeywords]);

  // Unified ad metrics (primitives — safe without memo)
  const totalAdSpend = uTotals.ad_spend || 0;
  const totalAdRevenue = uTotals.ad_revenue || 0;
  const totalROAS = uTotals.roas || 0;
  const totalConversions = Math.round(uTotals.conversions || 0);

  // Combined chart: organic clicks vs paid clicks — stable ref so Recharts doesn't churn
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

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, fontFamily: "'Plus Jakarta Sans', var(--font-display), sans-serif", color: c.text }}>
            {userName ? <>Welcome back, <span style={{ color: '#7C3AED' }}>{userName}</span></> : 'Dashboard'}
          </h1>
          <p style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>
            {connectedProviders.length > 0
              ? `${connectedProviders.length} source${connectedProviders.length > 1 ? 's' : ''} connected · Last ${days} days`
              : 'Connect your first integration to see live data'}
          </p>
        </div>
        <DateRangePicker value={days} onChange={setDays} />
      </div>

      {/* KPI Cards */}
      <h2 className="sr-only">Performance overview</h2>
      <div className="kpi-grid stagger-in" style={{ marginBottom: 20 }}>
        <StatCard label="Sessions" value={hasGA4 ? formatNumber(totalSessions) : '—'} sub={hasGA4 ? `${formatNumber(totalUsers)} users` : 'Connect GA4'} color={c.accent} icon={BarChart3} loading={loading} platformLogo="googleanalytics" />
        <StatCard label="Organic Clicks" value={hasGSC ? formatNumber(totalClicks) : '—'} sub={hasGSC ? `${formatNumber(totalImpressions)} impressions` : 'Connect GSC'} color={c.accent} icon={TrendingUp} loading={loading} platformLogo="googlesearchconsole" />
        <StatCard label="Ad Spend" value={hasAds ? fmtCurrency(totalAdSpend) : '—'} sub={hasAds ? `${formatNumber(totalConversions)} conversions` : 'Connect Ads'} color="#F97316" icon={Zap} loading={loading} />
        <StatCard label="ROAS" value={formatROAS(totalROAS, hasAds && totalAdRevenue > 0)} sub={hasAds && totalAdRevenue > 0 ? `${fmtCurrency(totalAdRevenue)} revenue` : hasAds ? 'No revenue data yet' : 'Connect Ads'} color={totalROAS >= 2 ? '#22C55E' : '#F59E0B'} icon={Target} loading={loading} />
      </div>

      {/* Anomalies — full width */}
      <h2 className="sr-only">Insights and anomalies</h2>
      <AnomaliesWidget workspaceId={workspace?.id} />

      {/* Traffic chart + Top pages */}
      <div className="two-col stagger-in" style={{ marginBottom: 20, marginTop: 20 }}>
        {/* Traffic chart */}
        <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: '20px 24px', boxShadow: c.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: c.text, fontFamily: "'Plus Jakarta Sans', var(--font-display), sans-serif" }}>Organic vs Paid traffic</h3>
              <p style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>Daily clicks — last 30 days</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: c.textSecondary }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#7C3AED', display: 'inline-block' }} /> Organic
              </span>
              {hasAds && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: c.textSecondary }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0891B2', display: 'inline-block' }} /> Paid
                </span>
              )}
            </div>
          </div>
          {chartData.length > 0 ? (
            <>
            {!hasAds && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 12, marginTop: -8, marginBottom: 8, color: c.textMuted }}>
                <button onClick={() => router.push('/dashboard/settings')} style={{ background: 'none', border: 'none', color: '#7C3AED', fontWeight: 500, fontSize: 12, cursor: 'pointer', padding: 0 }}>
                  Connect Google Ads or Meta Ads →
                </button>
              </div>
            )}
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0891B2" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#0891B2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="transparent" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis stroke="transparent" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: `1px solid ${c.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12, backgroundColor: c.bgCard }}
                  itemStyle={{ color: c.text }}
                  labelStyle={{ color: c.textSecondary }}
                />
                <Area type="monotone" dataKey="clicks" name="Organic" stroke="#7C3AED" fill="url(#gDash)" strokeWidth={2.5} dot={false} />
                {hasAds && <Area type="monotone" dataKey="paid" name="Paid" stroke="#0891B2" fill="none" strokeWidth={2} strokeDasharray="4 3" dot={false} />}
              </AreaChart>
            </ResponsiveContainer>
            </>
          ) : (
            <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <p style={{ fontSize: 14, color: c.textMuted }}>No traffic data yet</p>
              <button onClick={() => router.push('/dashboard/settings')} style={{ fontSize: 13, color: c.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Connect Google Search Console →
              </button>
            </div>
          )}
        </div>

        {/* Top pages / keywords table */}
        <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: c.text, fontFamily: "'Plus Jakarta Sans', var(--font-display), sans-serif" }}>Top keywords</h3>
            {hasGSC && (
              <button onClick={() => router.push('/dashboard/seo')} style={{ fontSize: 12, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                View all →
              </button>
            )}
          </div>
          {topKeywords.length > 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${c.border}`, fontSize: 10, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <span style={{ width: 32 }}>#</span>
                <span style={{ flex: 1 }}>Keyword</span>
                <span style={{ width: 56, textAlign: 'right' }}>Clicks</span>
                <span style={{ width: 64, textAlign: 'right' }}>Impr.</span>
                <span style={{ width: 48, textAlign: 'right' }}>CTR</span>
              </div>
              {topKeywords.map((kw: any, i: number) => {
                const pos = kw.position || 0;
                const rankColor = pos <= 1 ? '#059669' : pos <= 3 ? '#059669' : pos <= 10 ? '#7C3AED' : pos <= 20 ? '#F59E0B' : '#94A3B8';
                return (
                  <div key={kw.query || i} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: i < topKeywords.length - 1 ? `1px solid ${c.borderSubtle}` : 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: c.textSecondary }}>
                    <span style={{ width: 32, flexShrink: 0 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '2px 7px', borderRadius: 20,
                        background: `${rankColor}18`, color: rankColor,
                        fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                      }}>#{Math.round(pos)}</span>
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 4 }}>{kw.query}</span>
                    <span style={{ fontWeight: (kw.clicks || 0) > 50 ? 700 : 600, color: (kw.clicks || 0) > 50 ? c.text : '#7C3AED', fontSize: 13, width: 56, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{kw.clicks}</span>
                    <span style={{ fontSize: 12, color: c.textSecondary, width: 64, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{kw.impressions ? formatNumber(kw.impressions) : '0'}</span>
                    <span style={{ fontSize: 12, color: c.textSecondary, width: 48, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{kw.ctr?.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <p style={{ fontSize: 14, color: c.textMuted }}>No keyword data yet</p>
              <button onClick={() => router.push('/dashboard/settings')} style={{ fontSize: 13, color: c.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Sync Search Console →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Keywords table + Quick actions */}
      <div className="two-col stagger-in" style={{ marginBottom: 20 }}>
        {/* Quick wins / keyword table */}
        {quickWins.length > 0 ? (
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div className="icon-pill-sm"><Brain size={14} color={c.accent} /></div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>Quick wins</h3>
              <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 100, backgroundColor: c.warningSubtle, color: c.warning, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>Action needed</span>
            </div>
            <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 14, lineHeight: 1.6 }}>Keywords ranking 4-10 with low CTR — optimize title tags to push to page 1.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickWins.map((kw: any, i: number) => (
                <div key={kw.query || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, backgroundColor: c.bgCardHover, border: `1px solid ${c.border}` }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.warning, fontVariantNumeric: 'tabular-nums', width: 32 }}>#{Math.round(kw.position)}</span>
                  <span style={{ flex: 1, fontSize: 13, color: c.textSecondary }}>{kw.query}</span>
                  <span style={{ fontSize: 12, color: c.textMuted }}>{kw.impressions ? formatNumber(kw.impressions) : '0'} impr.</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.danger, fontVariantNumeric: 'tabular-nums' }}>{kw.ctr?.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 24px', textAlign: 'center', minHeight: 160 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EDE9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>⚡</div>
              <h4 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 6 }}>No quick wins yet</h4>
              <p style={{ fontSize: 13, color: c.textMuted, maxWidth: 300, lineHeight: 1.6, margin: 0 }}>
                Quick wins appear when a keyword ranks 4-10 but has low CTR. Connect GSC and sync data to see them.
              </p>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: '20px 24px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: c.text, fontFamily: "'Plus Jakarta Sans', var(--font-display), sans-serif", marginBottom: 12 }}>Quick actions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {[
              { label: 'Run keyword gap analysis', icon: Search, href: '/dashboard/competitors' },
              { label: 'Generate report', icon: FileText, href: '/dashboard/reports' },
              { label: 'Invite team member', icon: Users, href: '/dashboard/settings' },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px', borderRadius: 8,
                  border: `1px solid ${c.border}`, backgroundColor: c.bgCard,
                  color: c.textSecondary, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 150ms, color 150ms, box-shadow 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.color = '#7C3AED'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(124,58,237,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.textSecondary; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <action.icon size={15} color="currentColor" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Connect CTA */}
      {connectedProviders.length === 0 && !loading && (
        <div style={{ padding: 24, borderRadius: 12, border: `1px solid ${c.border}`, backgroundColor: c.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 4 }}>Connect your first data source</h3>
            <p style={{ fontSize: 13, color: c.textMuted }}>Link GSC, GA4, Google Ads, or Meta Ads to populate your dashboard with real data.</p>
          </div>
          <Button variant="gradient" onClick={() => router.push('/dashboard/settings')}>
            Connect now <ArrowRight size={14} />
          </Button>
        </div>
      )}

      {/* Integration Status + Cross-Channel Insights */}
      {connectedProviders.length > 0 && (
        <div className="two-col stagger-in" style={{ marginBottom: 20 }}>
          {/* Integration Status */}
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)', marginBottom: 16 }}>Data Sources</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(unifiedResp?.integrations || []).map((int: any) => {
                const providerNames: Record<string, string> = { gsc: 'Google Search Console', ga4: 'Google Analytics', google_ads: 'Google Ads', meta_ads: 'Meta Ads' };
                const lastSync = int.last_sync_at ? new Date(int.last_sync_at) : null;
                const isStale = lastSync ? (Date.now() - lastSync.getTime() > 25 * 60 * 60 * 1000) : true;
                return (
                  <div key={int.provider} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, backgroundColor: c.bgCardHover, border: `1px solid ${c.border}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isStale ? c.warning : c.success, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: c.text }}>{providerNames[int.provider] || int.provider}</span>
                    <span style={{ fontSize: 11, color: c.textMuted }}>
                      {lastSync ? `${Math.round((Date.now() - lastSync.getTime()) / 3600000)}h ago` : 'Never'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cross-Channel Insights */}
          <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div className="icon-pill-sm"><Sparkles size={14} color={c.accent} /></div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>Cross-Channel</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {hasGSC && hasAds && totalAdSpend > 0 && (
                <div style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: c.bgCardHover, border: `1px solid ${c.border}`, fontSize: 13, color: c.textSecondary, lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600, color: c.text }}>Organic vs Paid: </span>
                  {totalClicks > (uTotals.paid_clicks || 0)
                    ? `Organic drives ${Math.round(totalClicks / ((uTotals.paid_clicks || 1)) * 100) / 100}x more clicks than paid.`
                    : `Paid drives ${Math.round((uTotals.paid_clicks || 0) / (totalClicks || 1) * 100) / 100}x more clicks than organic.`}
                </div>
              )}
              {hasAds && totalROAS > 0 && (
                <div style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: c.bgCardHover, border: `1px solid ${c.border}`, fontSize: 13, color: c.textSecondary, lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600, color: totalROAS >= 2 ? c.success : c.warning }}>ROAS {formatROAS(totalROAS, true)}: </span>
                  {totalROAS >= 3 ? 'Strong returns — consider scaling spend.' : totalROAS >= 1.5 ? 'Healthy returns. Monitor for fatigue.' : 'Below target. Review underperforming campaigns.'}
                </div>
              )}
              {hasGA4 && totalSessions > 0 && (
                <div style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: c.bgCardHover, border: `1px solid ${c.border}`, fontSize: 13, color: c.textSecondary, lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600, color: c.text }}>Traffic: </span>
                  {`${formatNumber(totalSessions)} sessions from ${formatNumber(totalUsers)} users in the last ${days} days.`}
                </div>
              )}
              {connectedProviders.length < 4 && (
                <div style={{ padding: '10px 12px', borderRadius: 8, border: `1px dashed ${c.border}`, fontSize: 12, color: c.textMuted, textAlign: 'center' }}>
                  Connect {4 - connectedProviders.length} more source{4 - connectedProviders.length > 1 ? 's' : ''} for deeper cross-channel insights
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Insights widget */}
      <h2 className="sr-only">AI insights and forecasts</h2>
      <AIInsightsWidget workspaceId={workspace?.id} />

      {/* Recommendations + Predictions */}
      <div className="two-col stagger-in" style={{ marginTop: 20 }}>
        <RecommendationsWidget workspaceId={workspace?.id} />
        <PredictionsWidget workspaceId={workspace?.id} />
      </div>
    </div>
  );
}

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

  const priorityColors: Record<string, string> = { high: c.danger, medium: c.warning, low: c.success };

  return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div className="icon-pill-sm"><Lightbulb size={14} color={c.accent} /></div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>AI Recommendations</h3>
      </div>
      {loading ? (
        <div style={{ height: 80, backgroundColor: c.bgCardHover, borderRadius: 8 }} className="animate-pulse" />
      ) : fetchError ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: 12, color: c.textMuted, marginBottom: 8 }}>Failed to load recommendations</p>
          <button onClick={loadRecs} style={{ fontSize: 12, color: c.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
        </div>
      ) : recs.length === 0 ? (
        <p style={{ fontSize: 12, color: c.textMuted }}>No recommendations yet. Connect integrations and sync data to get AI-powered suggestions.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recs.slice(0, 4).map((r: any, i: number) => (
            <div key={r.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8, backgroundColor: c.bgCardHover, border: `1px solid ${c.border}` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: priorityColors[r.priority] || c.textMuted, marginTop: 6, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: c.text, marginBottom: 2 }}>{r.title}</p>
                <p style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.5 }}>{r.description}</p>
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
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div className="icon-pill-sm" style={{ backgroundColor: c.successSubtle, borderColor: 'rgba(16,185,129,0.12)' }}><TrendingUp size={14} color={c.success} /></div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>Traffic Forecast</h3>
      </div>
      {loading ? (
        <div style={{ height: 80, backgroundColor: c.bgCardHover, borderRadius: 8 }} className="animate-pulse" />
      ) : fetchError ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: 12, color: c.textMuted, marginBottom: 8 }}>Failed to load forecast</p>
          <button onClick={loadPredictions} style={{ fontSize: 12, color: c.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
        </div>
      ) : forecast.length === 0 ? (
        <p style={{ fontSize: 12, color: c.textMuted }}>{prediction?.message || 'Connect GA4 and sync data to see traffic predictions.'}</p>
      ) : (
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, color: c.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>
            ~{formatNumber(avgForecast)}
          </div>
          <p style={{ fontSize: 11, color: c.textSecondary, marginBottom: 12 }}>avg daily sessions forecast (next 14 days)</p>
          {narrative && (
            <p style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.6, padding: '10px 12px', backgroundColor: c.bgCardHover, borderRadius: 8, border: `1px solid ${c.border}` }}>
              {narrative}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

/* ─── Anomalies Dashboard Widget ─── */

const AnomaliesWidget = memo(function AnomaliesWidget({ workspaceId }: { workspaceId: string | undefined }) {
  const { c, theme } = useTheme();
  const isDark = theme === 'dark';
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
  // Sort: high severity first, then medium, then low
  const sorted = useMemo(() => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...anomalies].sort((a, b) => (order[a.severity] ?? 2) - (order[b.severity] ?? 2));
  }, [anomalies]);
  const display = useMemo(() => (expanded ? sorted : sorted.slice(0, 3)), [sorted, expanded]);
  const hiddenCount = sorted.length - 3;

  if (loading) return (
    <div
      aria-busy="true" aria-label="Loading anomalies"
      style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: '20px 24px', minHeight: 88 }}
      className="animate-pulse"
    />
  );

  if (fetchError) return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
      <AlertTriangle size={20} color={c.warning} style={{ margin: '0 auto 8px' }} />
      <p style={{ fontSize: 13, color: c.textSecondary, marginBottom: 12 }}>Failed to load anomalies</p>
      <button onClick={loadAnomalies} style={{ fontSize: 12, color: c.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
    </div>
  );

  return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} color="#F59E0B" />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: c.text }}>AI Anomalies</h3>
          {unread.length > 0 && (
            <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
              {unread.length} new
            </span>
          )}
        </div>
        <button
          onClick={() => router.push('/dashboard/alerts')}
          style={{ fontSize: 12, color: c.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
        >
          View all →
        </button>
      </div>

      {display.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
          <CheckCircle size={16} color="#059669" />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: c.textSecondary }}>No anomalies detected — everything looks healthy</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {display.map((anomaly: any) => {
            const severity = anomaly.severity || 'low';
            const dotColor = severity === 'high' ? '#DC2626' : severity === 'medium' ? '#F59E0B' : '#0891B2';
            // Source badge — normalize from anomaly.source/provider
            const sourceRaw: string = (anomaly.source || anomaly.provider || '').toString().toLowerCase();
            let srcLabel = '', srcBg = '', srcColor = '';
            if (sourceRaw.includes('gsc') || sourceRaw.includes('search')) {
              srcLabel = 'GSC';
              srcBg = isDark ? 'rgba(5,150,105,0.18)' : 'rgba(5,150,105,0.1)';
              srcColor = isDark ? '#6EE7B7' : '#065F46';
            } else if (sourceRaw.includes('ga4') || sourceRaw.includes('analytics')) {
              srcLabel = 'GA4';
              srcBg = isDark ? 'rgba(234,88,12,0.2)' : 'rgba(234,88,12,0.1)';
              srcColor = isDark ? '#FDBA74' : '#9A3412';
            } else if (sourceRaw.includes('meta')) {
              srcLabel = 'Meta Ads';
              srcBg = isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)';
              srcColor = isDark ? '#C4B5FD' : '#5B21B6';
            } else if (sourceRaw.includes('google_ads') || sourceRaw.includes('google ads')) {
              srcLabel = 'Google Ads';
              srcBg = isDark ? 'rgba(37,99,235,0.2)' : 'rgba(37,99,235,0.1)';
              srcColor = isDark ? '#93C5FD' : '#1D4ED8';
            }
            return (
              <div
                key={anomaly.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10,
                  backgroundColor: c.bgCardHover, border: `1px solid ${c.border}`,
                  opacity: anomaly.is_read ? 0.55 : 1,
                  transition: 'background 150ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dotColor }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: dotColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {severity === 'high' ? 'Critical' : severity === 'medium' ? 'Warning' : 'Info'}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: c.text, margin: 0 }}>{anomaly.title}</p>
                  {anomaly.description && (
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anomaly.description}</p>
                  )}
                </div>
                {srcLabel && (
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11, fontWeight: 600,
                    padding: '3px 10px', borderRadius: 20,
                    background: srcBg, color: srcColor,
                    flexShrink: 0,
                  }}>{srcLabel}</span>
                )}
                <button
                  onClick={() => !anomaly.is_read && markAsRead(anomaly.id)}
                  disabled={anomaly.is_read}
                  aria-label="Dismiss"
                  style={{
                    background: 'none', border: 'none', padding: 4,
                    color: c.textMuted, cursor: anomaly.is_read ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
          {!expanded && hiddenCount > 0 && (
            <button
              onClick={() => setExpanded(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', padding: '10px 0',
                fontSize: 12, fontWeight: 600, color: c.accent,
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              Show {hiddenCount} more →
            </button>
          )}
          {expanded && hiddenCount > 0 && (
            <button
              onClick={() => setExpanded(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', padding: '10px 0',
                fontSize: 12, fontWeight: 600, color: c.textMuted,
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              ↑ Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
});

/* ─── AI Insights Dashboard Widget ─── */

const AIInsightsWidget = memo(function AIInsightsWidget({ workspaceId }: { workspaceId: string | undefined }) {
  const { c } = useTheme();
  const router = useRouter();
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const INSIGHT_DOT_COLORS: Record<string, string> = {
    win: c.success,
    warning: c.danger,
    opportunity: c.warning,
    tip: c.accent,
  };

  const INSIGHT_ICONS: Record<string, any> = {
    win: TrendingUp,
    warning: AlertTriangle,
    opportunity: Lightbulb,
    tip: Zap,
  };

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

  if (loading) return (
    <div
      aria-busy="true" aria-label="Loading AI insights"
      style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: '20px 24px', minHeight: 88 }}
      className="animate-pulse"
    />
  );

  if (fetchError) return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
      <Sparkles size={20} color={c.textMuted} style={{ margin: '0 auto 8px' }} />
      <p style={{ fontSize: 13, color: c.textSecondary, marginBottom: 12 }}>Failed to load insights</p>
      <button onClick={loadInsights} style={{ fontSize: 12, color: c.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
    </div>
  );

  return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="icon-pill-sm"><Sparkles size={14} color={c.accent} /></div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: c.text, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>AI Insights</h3>
        </div>
        <button
          onClick={() => router.push('/dashboard/ai')}
          style={{ fontSize: 12, color: c.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          View all <ArrowRight size={12} />
        </button>
      </div>

      {top3.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          <p style={{ fontSize: 13, color: c.textMuted }}>No insights generated yet. Let AI analyze your data.</p>
          <button
            onClick={generate}
            disabled={generating}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              backgroundColor: c.accent, color: 'white',
              fontSize: 13, fontWeight: 600,
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.7 : 1, whiteSpace: 'nowrap',
              transition: 'background-color 0.2s',
            }}
          >
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {top3.map((insight: any) => {
            const Icon = INSIGHT_ICONS[insight.type] || Zap;
            const dotColor = INSIGHT_DOT_COLORS[insight.type] || c.accent;
            return (
              <div key={insight.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 8, backgroundColor: c.bgCardHover, border: `1px solid ${c.border}`, minHeight: 64 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0, marginTop: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: c.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>{insight.title}</p>
                  <p style={{ fontSize: 13, color: c.textSecondary, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{insight.description}</p>
                </div>
                <Icon size={20} color={dotColor} style={{ flexShrink: 0, marginTop: 2 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
