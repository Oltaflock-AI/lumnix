'use client';
import { useState, useEffect } from 'react';
import { Bell, AlertCircle, AlertTriangle, Info, CheckCircle2, TrendingDown, TrendingUp, Search, BarChart3, X, RefreshCw } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useWorkspace, useGSCData, useGA4Data } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';

type Alert = {
  id: string;
  title: string;
  detail: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  source: string;
  dismissed: boolean;
};

function generateAlerts(gscKeywords: any[], ga4Data: any[]): Alert[] {
  const alerts: Alert[] = [];

  if (!gscKeywords.length && !ga4Data.length) return [];

  // GSC alerts
  if (gscKeywords.length > 0) {
    // Quick wins — positions 4-10 with low CTR
    const quickWins = gscKeywords.filter(k => k.position >= 4 && k.position <= 10 && k.ctr < 2);
    if (quickWins.length > 0) {
      alerts.push({
        id: 'qw-1',
        title: `${quickWins.length} keyword${quickWins.length > 1 ? 's' : ''} on page 1 edge`,
        detail: `"${quickWins[0]?.query}" ranks #${Math.round(quickWins[0]?.position)} with only ${quickWins[0]?.ctr?.toFixed(1)}% CTR. Improve title/meta to push to page 1.`,
        severity: 'warning',
        source: 'GSC',
        dismissed: false,
      });
    }

    // Top 3 winners
    const top3 = gscKeywords.filter(k => k.position <= 3 && k.clicks > 10);
    if (top3.length > 0) {
      alerts.push({
        id: 'top3-1',
        title: `${top3.length} keyword${top3.length > 1 ? 's' : ''} ranking in top 3`,
        detail: `"${top3[0]?.query}" is at #${Math.round(top3[0]?.position)} with ${top3[0]?.clicks} clicks. Protect this ranking.`,
        severity: 'success',
        source: 'GSC',
        dismissed: false,
      });
    }

    // Zero-click high impressions
    const zeroClick = gscKeywords.filter(k => k.impressions > 500 && k.clicks === 0);
    if (zeroClick.length > 0) {
      alerts.push({
        id: 'zc-1',
        title: `${zeroClick.length} high-impression keyword${zeroClick.length > 1 ? 's' : ''} with zero clicks`,
        detail: `"${zeroClick[0]?.query}" has ${zeroClick[0]?.impressions?.toLocaleString()} impressions but 0 clicks. Title/meta needs work.`,
        severity: 'critical',
        source: 'GSC',
        dismissed: false,
      });
    }

    // Average position check
    const avgPos = gscKeywords.reduce((s, k) => s + k.position, 0) / gscKeywords.length;
    if (avgPos > 20) {
      alerts.push({
        id: 'pos-1',
        title: 'Average keyword position is below page 2',
        detail: `Your average position is #${avgPos.toFixed(1)}. Most traffic comes from page 1. Focus on your top 10 keywords first.`,
        severity: 'warning',
        source: 'GSC',
        dismissed: false,
      });
    }
  }

  // GA4 alerts
  if (ga4Data.length > 0) {
    const sessionRows = ga4Data.filter(r => r.metric_type === 'sessions');
    if (sessionRows.length > 1) {
      const half = Math.floor(sessionRows.length / 2);
      const recent = sessionRows.slice(half).reduce((s: number, r: any) => s + r.value, 0);
      const previous = sessionRows.slice(0, half).reduce((s: number, r: any) => s + r.value, 0);
      const change = previous > 0 ? ((recent - previous) / previous) * 100 : 0;

      if (change < -20) {
        alerts.push({
          id: 'traffic-drop',
          title: `Traffic dropped ${Math.abs(Math.round(change))}% vs previous period`,
          detail: `Sessions fell from ${previous.toLocaleString()} to ${recent.toLocaleString()}. Check for algorithm updates or technical issues.`,
          severity: 'critical',
          source: 'GA4',
          dismissed: false,
        });
      } else if (change > 30) {
        alerts.push({
          id: 'traffic-spike',
          title: `Traffic spiked +${Math.round(change)}% vs previous period`,
          detail: `Sessions grew from ${previous.toLocaleString()} to ${recent.toLocaleString()}. Investigate what's driving this growth.`,
          severity: 'success',
          source: 'GA4',
          dismissed: false,
        });
      }
    }
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'all-good',
      title: 'Everything looks healthy',
      detail: 'No anomalies detected in your connected data sources. Keep monitoring.',
      severity: 'info',
      source: 'Lumnix AI',
      dismissed: false,
    });
  }

  return alerts;
}

const severityConfig = {
  critical: { icon: AlertCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)' },
  warning:  { icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
  info:     { icon: Info, color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.15)' },
  success:  { icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
};

export default function AlertsPage() {
  const { c } = useTheme();
  const { workspace } = useWorkspaceCtx();
  const { data: gscResp, loading: gscLoading } = useGSCData(workspace?.id, 'keywords', 30);
  const { data: ga4Resp, loading: ga4Loading } = useGA4Data(workspace?.id, 'overview', 30);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const loading = gscLoading || ga4Loading;
  const gscKeywords = gscResp?.keywords || [];
  const ga4Data = ga4Resp?.data || [];

  const allAlerts = generateAlerts(gscKeywords, ga4Data);
  const activeAlerts = allAlerts.filter(a => !dismissed.has(a.id));

  const counts = {
    critical: activeAlerts.filter(a => a.severity === 'critical').length,
    warning: activeAlerts.filter(a => a.severity === 'warning').length,
    success: activeAlerts.filter(a => a.severity === 'success').length,
  };

  return (
    <PageShell title="Alerts" description="AI-detected anomalies and opportunities from your live data" icon={Bell}>
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Critical', count: counts.critical, color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
          { label: 'Warnings', count: counts.warning, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Wins', count: counts.success, color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 20px', borderRadius: 10, backgroundColor: s.bg, border: `1px solid ${s.color}20`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.count}</span>
            <span style={{ fontSize: 13, color: c.textSecondary }}>{s.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.textMuted }}>
          <RefreshCw size={13} />
          <span>Based on your last sync</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 80, backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeAlerts.map(alert => {
            const cfg = severityConfig[alert.severity];
            return (
              <div key={alert.id} style={{ padding: '16px 20px', borderRadius: 12, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <cfg.icon size={20} color={cfg.color} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 4 }}>{alert.title}</div>
                  <div style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.5 }}>{alert.detail}</div>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: `${cfg.color}12`, color: cfg.color }}>
                      {alert.source}
                    </span>
                    <span style={{ fontSize: 11, color: c.textMuted }}>Live data</span>
                  </div>
                </div>
                <button
                  onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: 4, flexShrink: 0 }}
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && dismissed.size > 0 && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            onClick={() => setDismissed(new Set())}
            style={{ fontSize: 12, color: c.accent, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Restore {dismissed.size} dismissed alert{dismissed.size > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Setup note if no data */}
      {!loading && gscKeywords.length === 0 && ga4Data.length === 0 && (
        <div style={{ marginTop: 20, padding: 20, borderRadius: 12, backgroundColor: c.bgCard, border: `1px solid ${c.border}`, textAlign: 'center' }}>
          <Bell size={28} color={c.textMuted} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 14, color: c.textSecondary, marginBottom: 8 }}>Connect and sync GSC or GA4 to get real-time alerts</p>
          <a href="/dashboard/settings" style={{ fontSize: 13, color: c.accent, textDecoration: 'none', fontWeight: 500 }}>Go to Settings &rarr;</a>
        </div>
      )}
    </PageShell>
  );
}
