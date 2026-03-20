'use client';
import { useState } from 'react';
import { FileText, Download, BarChart3, Search, TrendingUp, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useWorkspace, useGSCData, useGA4Data } from '@/lib/hooks';

const reportTypes = [
  { id: 'seo', label: 'SEO Report', icon: Search, color: '#7c3aed', desc: 'Keywords, positions, CTR, quick wins', sections: ['Top Keywords', 'Position Distribution', 'Quick Wins', 'Low CTR Opportunities'] },
  { id: 'analytics', label: 'Traffic Report', icon: BarChart3, color: '#3b82f6', desc: 'Sessions, users, sources, top pages', sections: ['Overview KPIs', 'Traffic Sources', 'Top Pages', 'Traffic Trend'] },
  { id: 'full', label: 'Full Marketing Report', icon: TrendingUp, color: '#22c55e', desc: 'All connected sources combined', sections: ['Executive Summary', 'SEO Performance', 'Traffic Analytics', 'Recommendations'] },
];

function generateCSVReport(type: string, gscKeywords: any[], ga4Data: any[]) {
  if (type === 'seo' || type === 'full') {
    const headers = ['Keyword', 'Position', 'Impressions', 'Clicks', 'CTR', 'Signal'];
    const rows = gscKeywords.map((kw: any) => {
      const signal = kw.position <= 3 ? 'Top 3'
        : (kw.position >= 4 && kw.position <= 10 && kw.ctr < 3) ? 'Quick Win'
        : (kw.impressions > 500 && kw.ctr < 1) ? 'Low CTR' : '';
      return [kw.query, Math.round(kw.position), kw.impressions, kw.clicks, `${kw.ctr?.toFixed(1)}%`, signal];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    return { csv, filename: `lumnix-seo-report-${new Date().toISOString().slice(0,10)}.csv` };
  }

  if (type === 'analytics') {
    const sessionRows = ga4Data.filter((r: any) => r.metric_type === 'sessions');
    const headers = ['Date', 'Sessions'];
    const dateMap: Record<string, number> = {};
    sessionRows.forEach((r: any) => { dateMap[r.date] = (dateMap[r.date] || 0) + r.value; });
    const rows = Object.entries(dateMap).sort().map(([date, sessions]) => [date, sessions]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    return { csv, filename: `lumnix-analytics-report-${new Date().toISOString().slice(0,10)}.csv` };
  }

  return null;
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { workspace } = useWorkspace();
  const { data: gscResp, loading: gscLoading } = useGSCData(workspace?.id, 'keywords', 30);
  const { data: ga4Resp, loading: ga4Loading } = useGA4Data(workspace?.id, 'overview', 30);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);

  const gscKeywords = gscResp?.keywords || [];
  const ga4Data = ga4Resp?.data || [];

  const totalClicks = gscKeywords.reduce((s: number, k: any) => s + k.clicks, 0);
  const totalSessions = ga4Data.filter((r: any) => r.metric_type === 'sessions').reduce((s: number, r: any) => s + r.value, 0);
  const quickWins = gscKeywords.filter((k: any) => k.position >= 4 && k.position <= 10 && k.ctr < 3).length;

  async function handleGenerate(type: string) {
    setGenerating(type);
    await new Promise(r => setTimeout(r, 1200));

    const result = generateCSVReport(type, gscKeywords, ga4Data);
    if (result) {
      downloadCSV(result.csv, result.filename);
      setGenerated(type);
      setTimeout(() => setGenerated(null), 3000);
    }
    setGenerating(null);
  }

  return (
    <PageShell title="Reports" description="Generate and export reports from your live marketing data" icon={FileText}>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Keywords tracked', value: gscKeywords.length.toLocaleString(), icon: Search, color: '#7c3aed' },
          { label: 'Total clicks (30d)', value: totalClicks.toLocaleString(), icon: TrendingUp, color: '#0891b2' },
          { label: 'Sessions (30d)', value: totalSessions.toLocaleString(), icon: BarChart3, color: '#22c55e' },
          { label: 'Quick wins', value: quickWins.toString(), icon: TrendingUp, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <s.icon size={13} color={s.color} />
              <span style={{ fontSize: 11, color: '#52525b' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f4f4f5', fontFamily: 'var(--font-display)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Report cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
        {reportTypes.map(rt => (
          <div key={rt.id} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${rt.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <rt.icon size={18} color={rt.color} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f4f4f5' }}>{rt.label}</h3>
                <p style={{ fontSize: 12, color: '#52525b', marginTop: 1 }}>{rt.desc}</p>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              {rt.sections.map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
                  <CheckCircle2 size={12} color="#334155" />
                  <span style={{ fontSize: 12, color: '#64748b' }}>{s}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleGenerate(rt.id)}
                disabled={generating === rt.id}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none',
                  backgroundColor: generated === rt.id ? '#22c55e' : rt.color,
                  color: 'white', fontSize: 13, fontWeight: 600,
                  cursor: generating === rt.id ? 'wait' : 'pointer',
                  opacity: generating === rt.id ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                {generating === rt.id ? (
                  <><Clock size={14} /> Generating...</>
                ) : generated === rt.id ? (
                  <><CheckCircle2 size={14} /> Downloaded!</>
                ) : (
                  <><Download size={14} /> Export CSV</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Data note */}
      <div style={{ padding: 16, borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Calendar size={14} color="#7c3aed" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>Reports use last 30 days of synced data</span>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
          Reports pull from your connected GSC and GA4 integrations. Sync your data in Settings before exporting for the most up-to-date report.
          PDF export and scheduled email delivery coming soon.
        </p>
      </div>
    </PageShell>
  );
}
