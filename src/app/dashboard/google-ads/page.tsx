'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, Target, MousePointerClick, RefreshCw, AlertCircle, BarChart3, Zap, Star } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useIntegrations, useGoogleAdsData } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

function StatCard({ icon: Icon, color, label, value, sub }: { icon: any; color: string; label: string; value: string; sub?: string }) {
  const { c } = useTheme();
  return (
    <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: 12, color: c.textSecondary }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: c.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', marginBottom: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: c.textMuted }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const label = status === 'ENABLED' ? 'Active' : status === 'PAUSED' ? 'Paused' : status === 'REMOVED' ? 'Removed' : status;
  let bg = '', color = '';
  if (status === 'ENABLED') {
    bg = isDark ? 'rgba(5,150,105,0.2)' : '#DCFCE7';
    color = isDark ? '#6EE7B7' : '#166534';
  } else if (status === 'PAUSED') {
    bg = isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9';
    color = isDark ? '#CBD5E1' : '#475569';
  } else {
    bg = 'rgba(220,38,38,0.15)';
    color = isDark ? '#FCA5A5' : '#DC2626';
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 20,
      background: bg, color,
      fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
    }}>
      {label}
    </span>
  );
}

export default function GoogleAdsPage() {
  const { c, theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const { workspace, loading: wsLoading } = useWorkspaceCtx();
  const { integrations, loading: intLoading } = useIntegrations(workspace?.id);
  const [days, setDays] = useState(30);
  const { data: adsData, loading: dataLoading, refetch } = useGoogleAdsData(workspace?.id, days);

  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const integration = integrations.find(i => i.provider === 'google_ads');
  const loading = wsLoading || intLoading;

  const campaigns = adsData?.campaigns || [];
  const totals = adsData?.totals;
  const hasData = campaigns.length > 0;

  async function handleSync() {
    if (!integration || !workspace) return;
    setSyncing(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sync/google-ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ integration_id: integration.id, workspace_id: workspace.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sync failed');
      refetch();
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    }
    setSyncing(false);
  }

  const totalSpend = totals?.spend || 0;
  const totalClicks = totals?.clicks || 0;
  const totalImpressions = totals?.impressions || 0;
  const totalConversions = totals?.conversions || 0;
  const totalConvValue = totals?.conversions_value || 0;
  const avgCPC = totals?.avg_cpc || 0;
  const roas = totals?.roas || 0;

  return (
    <PageShell title="Google Ads" description="Campaign performance & spend tracking" icon={DollarSign}>

      {loading || dataLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[1,2,3,4,5,6].map(i => (
            <Skeleton key={i} className="h-[90px] w-full rounded-xl" />
          ))}
        </div>
      ) : !integration ? (
        <EmptyState
          icon={DollarSign}
          title="Connect Google Ads"
          description="Link your Google Ads account to track campaign performance, spend, ROAS, and get AI-powered optimization recommendations."
          actionLabel="Connect in Settings"
          onAction={() => router.push('/dashboard/settings')}
        />
      ) : (
        <>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: c.textMuted }}>
              <DateRangePicker value={days} onChange={setDays} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: c.textMuted }}>
              {integration.last_sync_at ? (
                <>
                  Last synced {new Date(integration.last_sync_at).toLocaleString()}
                  {Date.now() - new Date(integration.last_sync_at).getTime() > 24 * 60 * 60 * 1000 && (
                    <span style={{ fontSize: 11, color: c.warning, fontWeight: 600 }}>Stale</span>
                  )}
                </>
              ) : 'Never synced'}
            </div>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 10, backgroundColor: c.dangerSubtle, border: `1px solid ${c.dangerBorder}`, marginBottom: 20 }}>
              <AlertCircle size={16} color={c.danger} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.danger, marginBottom: 2 }}>Sync Failed</div>
                <div style={{ fontSize: 12, color: c.textSecondary }}>{error}</div>
                {error.toLowerCase().includes('developer') && (
                  <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>
                    Add GOOGLE_ADS_DEVELOPER_TOKEN to your environment variables to enable the Google Ads API.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No data yet */}
          {!hasData && !error && (
            <div style={{ backgroundColor: c.bgCard, border: `1px dashed ${c.border}`, borderRadius: 14, padding: '48px 24px', textAlign: 'center', marginBottom: 20 }}>
              <BarChart3 size={32} color={c.borderStrong} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>No campaign data yet</div>
              <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Click "Sync Now" to pull your Google Ads campaigns.</div>
            </div>
          )}

          {/* Stats cards */}
          {hasData && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
                {/* Total Spend */}
                <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Total Spend</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: c.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    ₹{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginTop: 4 }}>Last {days} days</div>
                </div>
                {/* Total Clicks */}
                <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Total Clicks</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: c.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {totalClicks.toLocaleString()}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginTop: 4 }}>{totalImpressions.toLocaleString()} impressions</div>
                </div>
                {/* Conversions */}
                <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Conversions</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: c.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(totalConversions).toLocaleString()}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginTop: 4 }}>₹{totalConvValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} value</div>
                </div>
                {/* ROAS — hero */}
                <div style={{
                  background: isDark ? 'rgba(5,150,105,0.12)' : 'rgba(5,150,105,0.06)',
                  border: isDark ? '1px solid rgba(5,150,105,0.4)' : '1px solid #A7F3D0',
                  borderRadius: 12, padding: 18,
                }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: isDark ? '#6EE7B7' : '#065F46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>ROAS</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 700, color: isDark ? '#34D399' : '#065F46', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {roas.toFixed(2)}x
                  </div>
                  <span style={{
                    display: 'inline-block', marginTop: 6,
                    padding: '2px 10px', borderRadius: 20,
                    background: isDark ? 'rgba(5,150,105,0.25)' : '#DCFCE7',
                    color: isDark ? '#6EE7B7' : '#166534',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                  }}>
                    {roas >= 3 ? 'Healthy' : roas >= 1 ? 'Breakeven' : 'Losing money'}
                  </span>
                </div>
                {/* Avg CPC */}
                <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Avg CPC</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: avgCPC < 5 ? (isDark ? '#34D399' : '#059669') : c.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    ₹{avgCPC.toFixed(2)}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginTop: 4 }}>Per click average</div>
                </div>
                {/* Campaigns */}
                <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Campaigns</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: c.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {campaigns.length}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginTop: 4 }}>{campaigns.filter((c: any) => c.status === 'ENABLED').length} active</div>
                </div>
              </div>

              {/* Top performer highlight */}
              {(() => {
                const best = [...campaigns].filter(c => c.roas > 0).sort((a, b) => b.roas - a.roas)[0];
                if (!best) return null;
                return (
                  <div style={{
                    background: isDark ? 'rgba(5,150,105,0.1)' : 'rgba(5,150,105,0.05)',
                    border: isDark ? '1px solid rgba(5,150,105,0.3)' : '1px solid #A7F3D0',
                    borderLeft: '3px solid #059669',
                    borderRadius: 12, padding: '14px 18px', marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    <Star size={18} color={isDark ? '#34D399' : '#059669'} fill={isDark ? '#34D399' : '#059669'} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, color: isDark ? '#6EE7B7' : '#065F46', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Best ROAS</div>
                      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 600, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{best.campaign_name}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: c.textMuted, marginTop: 2 }}>
                        <span style={{ color: isDark ? '#34D399' : '#059669', fontWeight: 700 }}>{best.roas.toFixed(2)}x ROAS</span>
                        {' · '}₹{(best.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spend · {(best.clicks || 0).toLocaleString()} clicks · {Math.round(best.conversions || 0)} conversions
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Campaign table */}
              {(() => {
                const sortedCampaigns = [...campaigns].sort((a, b) => (b.cost || 0) - (a.cost || 0));
                const maxSpend = Math.max(...sortedCampaigns.map(c => c.cost || 0));
                return (
                  <div style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 14, padding: 24 }}>
                    <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 16 }}>Campaigns</h2>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                        <caption className="sr-only">Google Ads campaign performance</caption>
                        <thead>
                          <tr>
                            {['Campaign', 'Status', 'Spend ↓', 'Clicks', 'Impressions', 'Conversions', 'CPC', 'ROAS'].map(h => (
                              <th key={h} scope="col" style={{ textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 10, borderBottom: `1px solid ${c.border}`, paddingRight: 12, whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedCampaigns.map((camp: any, i: number) => {
                            const cRoas = camp.roas > 0 ? camp.roas.toFixed(2) : '—';
                            const cCpc = camp.avg_cpc > 0 ? camp.avg_cpc.toFixed(2) : '—';
                            const roasVal = parseFloat(cRoas as string);
                            const roasColor = roasVal >= 3 ? (isDark ? '#34D399' : '#065F46') : roasVal >= 1 ? '#F59E0B' : '#DC2626';
                            const spendPct = maxSpend > 0 ? ((camp.cost || 0) / maxSpend) * 100 : 0;
                            return (
                              <tr
                                key={camp.campaign_id || i}
                                style={{ borderBottom: `1px solid ${c.border}` }}
                                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = c.bgCardHover}
                                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
                              >
                                <td style={{ padding: '12px 12px 12px 0', maxWidth: 240 }}>
                                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: c.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{camp.campaign_name}</div>
                                  <div style={{ marginTop: 4, height: 3, borderRadius: 2, backgroundColor: c.bgCardHover, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', borderRadius: 2, background: '#7C3AED', width: `${spendPct}%` }} />
                                  </div>
                                </td>
                                <td style={{ padding: '12px 12px 12px 0' }}><StatusBadge status={camp.status} /></td>
                                <td style={{ padding: '12px 12px 12px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: c.text, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>₹{(camp.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td style={{ padding: '12px 12px 12px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: c.textSecondary, fontVariantNumeric: 'tabular-nums' }}>{(camp.clicks || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 12px 12px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: c.textSecondary, fontVariantNumeric: 'tabular-nums' }}>{(camp.impressions || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 12px 12px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: c.textSecondary, fontVariantNumeric: 'tabular-nums' }}>{Math.round(camp.conversions || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 12px 12px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontVariantNumeric: 'tabular-nums', color: cCpc !== '—' && parseFloat(cCpc) < 5 ? (isDark ? '#34D399' : '#059669') : c.textSecondary, fontWeight: cCpc !== '—' && parseFloat(cCpc) < 5 ? 600 : 400 }}>{cCpc !== '—' ? `₹${cCpc}` : '—'}</td>
                                <td style={{ padding: '12px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: roasColor }}>
                                  {cRoas !== '—' ? `${cRoas}x` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </>
      )}
    </PageShell>
  );
}
