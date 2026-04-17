'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, X, Bell } from 'lucide-react';
import { useGSCData, useGA4Data } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';
import { apiFetch } from '@/lib/api-fetch';
import { PageShell } from '@/components/PageShell';

type Alert = {
  id: string;
  title: string;
  detail: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  source: string;
  dismissed: boolean;
  anomalyId?: string; // DB anomaly id, if from anomalies table
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
        detail: `"${zeroClick[0]?.query}" has ${zeroClick[0]?.impressions?.toLocaleString('en-IN')} impressions but 0 clicks. Title/meta needs work.`,
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
          detail: `Sessions fell from ${previous.toLocaleString('en-IN')} to ${recent.toLocaleString('en-IN')}. Check for algorithm updates or technical issues.`,
          severity: 'critical',
          source: 'GA4',
          dismissed: false,
        });
      } else if (change > 30) {
        alerts.push({
          id: 'traffic-spike',
          title: `Traffic spiked +${Math.round(change)}% vs previous period`,
          detail: `Sessions grew from ${previous.toLocaleString('en-IN')} to ${recent.toLocaleString('en-IN')}. Investigate what's driving this growth.`,
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
  info:     { icon: Info, color: '#FF0066', bg: 'rgba(255,0,102,0.08)', border: 'rgba(255,0,102,0.15)' },
  success:  { icon: CheckCircle2, color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
};

function mapAnomalySeverity(severity: string): Alert['severity'] {
  if (severity === 'critical' || severity === 'high') return 'critical';
  if (severity === 'medium' || severity === 'warning') return 'warning';
  if (severity === 'success' || severity === 'positive') return 'success';
  return 'info';
}

type FilterKey = 'all' | 'critical' | 'warning' | 'info';

export default function AlertsPage() {
  const { c } = useTheme();
  const { workspace } = useWorkspaceCtx();
  const { data: gscResp, loading: gscLoading } = useGSCData(workspace?.id, 'keywords', 30);
  const { data: ga4Resp, loading: ga4Loading } = useGA4Data(workspace?.id, 'overview', 30);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [anomaliesLoading, setAnomaliesLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');

  // Fetch anomalies from DB
  useEffect(() => {
    if (!workspace?.id) return;
    const ctrl = new AbortController();
    apiFetch(`/api/anomalies?workspace_id=${workspace.id}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        if (!ctrl.signal.aborted) setAnomalies(data.anomalies || []);
      })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setAnomaliesLoading(false); });
    return () => ctrl.abort();
  }, [workspace?.id]);

  // Mark anomaly as read when dismissed
  const handleDismiss = useCallback((alertId: string, anomalyId?: string) => {
    setDismissed(prev => new Set([...prev, alertId]));
    if (anomalyId) {
      apiFetch(`/api/anomalies/${anomalyId}/read`, { method: 'POST' }).catch(() => {});
    }
  }, []);

  const loading = gscLoading || ga4Loading || anomaliesLoading;
  const gscKeywords = gscResp?.keywords || [];
  const ga4Data = ga4Resp?.data || [];

  const generatedAlerts = useMemo(() => generateAlerts(gscKeywords, ga4Data), [gscKeywords, ga4Data]);

  // Convert DB anomalies to Alert objects
  const anomalyAlerts = useMemo<Alert[]>(() =>
    anomalies.map(a => ({
      id: `anomaly-${a.id}`,
      title: a.title || a.type || 'Anomaly detected',
      detail: a.description || a.message || '',
      severity: mapAnomalySeverity(a.severity),
      source: a.source || 'Lumnix AI',
      dismissed: !!a.is_read,
      anomalyId: a.id,
    })),
  [anomalies]);

  const allAlerts = useMemo(() => {
    // Unread anomalies first, then generated alerts
    const unreadAnomalies = anomalyAlerts.filter(a => !a.dismissed);
    return [...unreadAnomalies, ...generatedAlerts];
  }, [anomalyAlerts, generatedAlerts]);

  const activeAlerts = useMemo(() => allAlerts.filter(a => !dismissed.has(a.id)), [allAlerts, dismissed]);

  const counts = useMemo(() => ({
    critical: activeAlerts.filter(a => a.severity === 'critical').length,
    warning: activeAlerts.filter(a => a.severity === 'warning').length,
    info: activeAlerts.filter(a => a.severity === 'info' || a.severity === 'success').length,
    total: activeAlerts.length,
  }), [activeAlerts]);

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return activeAlerts;
    if (filter === 'info') return activeAlerts.filter(a => a.severity === 'info' || a.severity === 'success');
    return activeAlerts.filter(a => a.severity === filter);
  }, [activeAlerts, filter]);

  const severityLabel: Record<Alert['severity'], string> = {
    critical: 'CRITICAL',
    warning: 'WARNING',
    info: 'INFO',
    success: 'WIN',
  };

  return (
    <PageShell
      title="Your"
      titleAccent="Alerts"
      description={`${counts.total} unresolved alert${counts.total === 1 ? '' : 's'} across all data sources`}
    >

      {/* Filter Pills */}
      <div className="lx-alert-filters">
        <button
          type="button"
          className={`lx-filter-pill${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`lx-filter-pill${filter === 'critical' ? ' active' : ''}`}
          onClick={() => setFilter('critical')}
        >
          Critical ({counts.critical})
        </button>
        <button
          type="button"
          className={`lx-filter-pill${filter === 'warning' ? ' active' : ''}`}
          onClick={() => setFilter('warning')}
        >
          Warning ({counts.warning})
        </button>
        <button
          type="button"
          className={`lx-filter-pill${filter === 'info' ? ' active' : ''}`}
          onClick={() => setFilter('info')}
        >
          Info ({counts.info})
        </button>
      </div>

      {/* Alert Summary Stats */}
      <div className="lx-alert-summary">
        <div className="lx-alert-stat lx-alert-stat--critical">
          <div className="lx-alert-stat-icon">
            <AlertCircle />
          </div>
          <div className="lx-alert-stat-content">
            <div className="lx-alert-stat-label">Critical</div>
            <div className="lx-alert-stat-value">{counts.critical}</div>
          </div>
        </div>

        <div className="lx-alert-stat lx-alert-stat--warning">
          <div className="lx-alert-stat-icon">
            <AlertTriangle />
          </div>
          <div className="lx-alert-stat-content">
            <div className="lx-alert-stat-label">Warning</div>
            <div className="lx-alert-stat-value">{counts.warning}</div>
          </div>
        </div>

        <div className="lx-alert-stat lx-alert-stat--info">
          <div className="lx-alert-stat-icon">
            <Info />
          </div>
          <div className="lx-alert-stat-content">
            <div className="lx-alert-stat-label">Info</div>
            <div className="lx-alert-stat-value">{counts.info}</div>
          </div>
        </div>
      </div>

      {/* Alerts Timeline */}
      <div className="lx-alert-timeline">
        <div className="lx-alert-timeline-title">Recent Alerts</div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  height: 80,
                  backgroundColor: c.bgCard,
                  border: `1px solid ${c.border}`,
                  borderRadius: 10,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                background: 'rgba(16,185,129,0.12)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <CheckCircle2 size={26} color="#10B981" />
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: 700,
                color: c.text,
                marginBottom: 8,
              }}
            >
              All clear!
            </h3>
            <p style={{ fontSize: 14, color: c.textMuted, maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
              No active alerts right now. Wins and anomalies appear here when Lumi detects signals from your connected data sources.
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const cfg = severityConfig[alert.severity];
            const itemClass =
              alert.severity === 'critical'
                ? 'lx-alert-item critical'
                : alert.severity === 'warning'
                  ? 'lx-alert-item warning'
                  : 'lx-alert-item info';
            const sevClass =
              alert.severity === 'critical'
                ? 'lx-alert-severity lx-alert-severity--critical'
                : alert.severity === 'warning'
                  ? 'lx-alert-severity lx-alert-severity--warning'
                  : 'lx-alert-severity lx-alert-severity--info';
            const SevIcon = cfg.icon;
            return (
              <div key={alert.id} className={itemClass}>
                <div className="lx-alert-icon">
                  <SevIcon />
                </div>
                <div className="lx-alert-content">
                  <div className="lx-alert-header">
                    <span className="lx-alert-title">{alert.title}</span>
                    <span className={sevClass}>{severityLabel[alert.severity]}</span>
                  </div>
                  <div className="lx-alert-description">{alert.detail}</div>
                  <div className="lx-alert-meta">
                    <span className="lx-alert-source">{alert.source}</span>
                    <span className="lx-alert-time">Live data</span>
                    <div className="lx-alert-actions">
                      <button
                        type="button"
                        className="lx-alert-btn lx-alert-btn--primary"
                        onClick={() => handleDismiss(alert.id, alert.anomalyId)}
                        aria-label={`Dismiss alert: ${alert.title}`}
                      >
                        <X size={12} aria-hidden="true" />
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && dismissed.size > 0 && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setDismissed(new Set())}
            style={{
              fontSize: 12,
              color: c.accent,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Restore {dismissed.size} dismissed alert{dismissed.size > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Setup note if no data */}
      {!loading && gscKeywords.length === 0 && ga4Data.length === 0 && (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            borderRadius: 12,
            backgroundColor: c.bgCard,
            border: `1px solid ${c.border}`,
            textAlign: 'center',
          }}
        >
          <Bell size={28} color={c.textMuted} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 14, color: c.textSecondary, marginBottom: 8 }}>
            Connect and sync GSC or GA4 to get real-time alerts
          </p>
          <a
            href="/dashboard/settings"
            style={{ fontSize: 13, color: c.accent, textDecoration: 'none', fontWeight: 500 }}
          >
            Go to Settings &rarr;
          </a>
        </div>
      )}
    </PageShell>
  );
}
