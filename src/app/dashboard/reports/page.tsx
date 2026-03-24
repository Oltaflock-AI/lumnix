'use client';
import { useState, useMemo } from 'react';
import { FileText, Download, BarChart3, Search, TrendingUp, Loader2, CheckCircle2, FileDown, Sparkles, Calendar, ChevronDown } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useWorkspace, useGSCData, useGA4Data, DateRangeParams } from '@/lib/hooks';
import { useWorkspaceCtx } from '@/lib/workspace-context';
import { useTheme } from '@/lib/theme';

const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 60 days', days: 60 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Custom range', days: 0 },
];


const reportTypes = [
  {
    id: 'seo',
    label: 'SEO Performance Report',
    icon: Search,
    color: '#7c3aed',
    desc: 'Keyword rankings, CTR analysis, quick wins, position distribution',
    sections: ['Executive Summary', 'Keyword Rankings', 'Position Distribution', 'CTR Analysis', 'Quick Win Opportunities', 'AI Recommendations'],
  },
  {
    id: 'analytics',
    label: 'Traffic & Analytics Report',
    icon: BarChart3,
    color: '#3b82f6',
    desc: 'Sessions, users, traffic sources, top pages, engagement',
    sections: ['Executive Summary', 'Traffic Overview', 'Traffic Sources', 'Top Pages', 'Trend Analysis', 'AI Recommendations'],
  },
  {
    id: 'full',
    label: 'Full Marketing Report',
    icon: TrendingUp,
    color: '#22c55e',
    desc: 'Complete SEO + Traffic analysis — client-ready 4-page report',
    sections: ['Executive Summary', 'SEO Performance', 'Traffic Analytics', 'Keyword Intelligence', 'Opportunities', 'Strategic Recommendations'],
  },
];

function getPeriodLabel(days: number) {
  const end = new Date();
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
}

function buildSEOReport(gscKeywords: any[], workspace: any, periodLabel?: string): string {
  const name = workspace?.name || 'Your Brand';
  const period = periodLabel || getPeriodLabel(30);
  const generated = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const totalClicks = gscKeywords.reduce((s: number, k: any) => s + (k.clicks || 0), 0);
  const totalImpressions = gscKeywords.reduce((s: number, k: any) => s + (k.impressions || 0), 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const avgPos = gscKeywords.length > 0 ? (gscKeywords.reduce((s: number, k: any) => s + (k.position || 0), 0) / gscKeywords.length).toFixed(1) : 'N/A';
  const top3 = gscKeywords.filter((k: any) => k.position <= 3);
  const page1 = gscKeywords.filter((k: any) => k.position <= 10);
  const page2 = gscKeywords.filter((k: any) => k.position > 10 && k.position <= 20);
  const quickWins = gscKeywords.filter((k: any) => k.position >= 4 && k.position <= 10 && (k.ctr || 0) < 3).slice(0, 10);
  const lowCTR = gscKeywords.filter((k: any) => (k.impressions || 0) > 200 && (k.ctr || 0) < 1).slice(0, 10);
  const topByClicks = [...gscKeywords].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 20);
  const topByImpressions = [...gscKeywords].sort((a, b) => (b.impressions || 0) - (a.impressions || 0)).slice(0, 10);

  const posRanges = [
    { label: '1–3 (Top 3)', count: top3.length, color: '#22c55e' },
    { label: '4–10 (Page 1)', count: gscKeywords.filter((k: any) => k.position > 3 && k.position <= 10).length, color: '#3b82f6' },
    { label: '11–20 (Page 2)', count: page2.length, color: '#f59e0b' },
    { label: '21+ (Page 3+)', count: gscKeywords.filter((k: any) => k.position > 20).length, color: '#ef4444' },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${name} — SEO Performance Report</title>
<style>
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111827; }
  .cover { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); min-height: 260px; padding: 48px; display: flex; flex-direction: column; justify-content: space-between; }
  .cover-brand { display: flex; align-items: center; gap: 12px; }
  .cover-dot { width: 10px; height: 10px; border-radius: 50%; background: #7c3aed; }
  .cover-lumnix { font-size: 15px; font-weight: 700; color: #a78bfa; letter-spacing: 1px; text-transform: uppercase; }
  .cover-title { font-size: 36px; font-weight: 900; color: #fff; line-height: 1.15; letter-spacing: -1px; margin-top: 24px; }
  .cover-sub { font-size: 16px; color: #94a3b8; margin-top: 8px; }
  .cover-meta { display: flex; gap: 24px; margin-top: 32px; }
  .cover-meta-item { }
  .cover-meta-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
  .cover-meta-val { font-size: 14px; color: #e2e8f0; font-weight: 600; }
  .body { padding: 40px 48px; }
  h2 { font-size: 13px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 1.5px; margin: 36px 0 16px; display: flex; align-items: center; gap: 8px; }
  h2::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
  h3 { font-size: 15px; font-weight: 700; color: #111827; margin: 20px 0 8px; }
  p { font-size: 14px; color: #374151; line-height: 1.7; margin-bottom: 10px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
  .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
  .kpi-val { font-size: 28px; font-weight: 800; color: #111827; letter-spacing: -1px; }
  .kpi-label { font-size: 12px; color: #6b7280; margin-top: 4px; font-weight: 500; }
  .kpi-change { font-size: 11px; color: #22c55e; margin-top: 2px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
  thead { background: #f1f5f9; }
  th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
  td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #374151; font-size: 13px; }
  tr:hover td { background: #fafafa; }
  .tag { font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 700; display: inline-block; }
  .tag-top3 { background: #dcfce7; color: #15803d; }
  .tag-win { background: #ede9fe; color: #6d28d9; }
  .tag-ctr { background: #fef3c7; color: #92400e; }
  .tag-imp { background: #dbeafe; color: #1d4ed8; }
  .pos-dist { display: flex; gap: 12px; margin: 12px 0; }
  .pos-bar { flex: 1; text-align: center; }
  .pos-bar-fill { border-radius: 6px; margin-bottom: 6px; }
  .pos-bar-label { font-size: 11px; color: #6b7280; font-weight: 600; }
  .pos-bar-count { font-size: 20px; font-weight: 800; color: #111827; }
  .rec { display: flex; gap: 14px; padding: 16px; border-radius: 10px; border: 1px solid #e5e7eb; margin-bottom: 10px; background: #fafafa; }
  .rec-num { width: 28px; height: 28px; border-radius: 8px; background: #ede9fe; color: #7c3aed; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rec-title { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px; }
  .rec-body { font-size: 13px; color: #6b7280; line-height: 1.6; }
  .footer { background: #f8fafc; border-top: 2px solid #e2e8f0; padding: 20px 48px; display: flex; justify-content: space-between; align-items: center; margin-top: 48px; }
  .footer-brand { font-size: 13px; font-weight: 700; color: #7c3aed; }
  .footer-note { font-size: 12px; color: #9ca3af; }
  .highlight-box { background: linear-gradient(135deg, #faf5ff, #f0f9ff); border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px 24px; margin: 16px 0; }
  .highlight-box p { color: #374151; font-size: 14px; line-height: 1.75; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-brand"><div class="cover-dot"></div><span class="cover-lumnix">Lumnix · Marketing Intelligence</span></div>
  <div>
    <div class="cover-title">SEO Performance Report<br>${name}</div>
    <div class="cover-sub">Search Visibility, Rankings & Organic Growth Analysis</div>
    <div class="cover-meta">
      <div class="cover-meta-item"><div class="cover-meta-label">Reporting Period</div><div class="cover-meta-val">${period}</div></div>
      <div class="cover-meta-item"><div class="cover-meta-label">Generated</div><div class="cover-meta-val">${generated}</div></div>
      <div class="cover-meta-item"><div class="cover-meta-label">Keywords Tracked</div><div class="cover-meta-val">${gscKeywords.length.toLocaleString()}</div></div>
    </div>
  </div>
</div>

<div class="body">

  <h2>Executive Summary</h2>
  <div class="highlight-box">
    <p><strong>${name}</strong> generated <strong>${totalClicks.toLocaleString()} organic clicks</strong> from <strong>${totalImpressions.toLocaleString()} impressions</strong> during the reporting period, achieving an average click-through rate of <strong>${avgCTR}%</strong> and an average ranking position of <strong>#${avgPos}</strong>. The site currently ranks for <strong>${gscKeywords.length} keywords</strong>, with <strong>${top3.length} keywords in the top 3 positions</strong> and <strong>${page1.length} keywords on page 1</strong> of Google search results. ${quickWins.length > 0 ? `There are <strong>${quickWins.length} high-priority quick win keywords</strong> (positions 4–10 with low CTR) that present immediate optimisation opportunities.` : ''}</p>
  </div>

  <h2>Performance KPIs</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-val">${totalClicks.toLocaleString()}</div><div class="kpi-label">Organic Clicks</div></div>
    <div class="kpi"><div class="kpi-val">${totalImpressions.toLocaleString()}</div><div class="kpi-label">Total Impressions</div></div>
    <div class="kpi"><div class="kpi-val">${avgCTR}%</div><div class="kpi-label">Avg Click-Through Rate</div></div>
    <div class="kpi"><div class="kpi-val">#${avgPos}</div><div class="kpi-label">Avg Ranking Position</div></div>
  </div>

  <h2>Position Distribution</h2>
  <p>Breakdown of keyword rankings across Google search result pages.</p>
  <div class="pos-dist">
    ${posRanges.map(r => `<div class="pos-bar">
      <div class="pos-bar-count" style="color:${r.color}">${r.count}</div>
      <div class="pos-bar-fill" style="background:${r.color}22;height:8px;"></div>
      <div class="pos-bar-label">${r.label}</div>
    </div>`).join('')}
  </div>
  <p style="font-size:13px;color:#6b7280;margin-top:8px">${((page1.length / Math.max(gscKeywords.length, 1)) * 100).toFixed(0)}% of tracked keywords are ranking on Page 1. ${top3.length > 0 ? `${top3.length} keywords hold top 3 positions — these drive the majority of clicks.` : ''}</p>

  <h2>Top Keywords by Clicks</h2>
  <table>
    <thead><tr><th>#</th><th>Keyword</th><th>Position</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>Signal</th></tr></thead>
    <tbody>
      ${topByClicks.map((k: any, i: number) => {
        const sig = k.position <= 3 ? '<span class="tag tag-top3">Top 3</span>'
          : (k.position >= 4 && k.position <= 10 && (k.ctr || 0) < 3) ? '<span class="tag tag-win">Quick Win</span>'
          : ((k.impressions || 0) > 200 && (k.ctr || 0) < 1) ? '<span class="tag tag-ctr">Low CTR</span>' : '';
        return `<tr><td style="color:#9ca3af;font-size:12px">${i + 1}</td><td><strong>${k.query}</strong></td><td>#${Math.round(k.position || 0)}</td><td>${(k.impressions || 0).toLocaleString()}</td><td><strong>${k.clicks || 0}</strong></td><td>${(k.ctr || 0).toFixed(1)}%</td><td>${sig}</td></tr>`;
      }).join('')}
    </tbody>
  </table>

  ${quickWins.length > 0 ? `
  <h2>Quick Win Opportunities</h2>
  <p>These keywords rank on Page 1 (positions 4–10) but have below-average CTR. Improving meta titles and descriptions for these pages can significantly increase clicks without needing to improve rankings.</p>
  <table>
    <thead><tr><th>Keyword</th><th>Position</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>Potential</th></tr></thead>
    <tbody>
      ${quickWins.map((k: any) => {
        const potential = Math.round((k.impressions || 0) * 0.05 - (k.clicks || 0));
        return `<tr><td><strong>${k.query}</strong></td><td>#${Math.round(k.position || 0)}</td><td>${(k.impressions || 0).toLocaleString()}</td><td>${k.clicks || 0}</td><td style="color:#f59e0b;font-weight:700">${(k.ctr || 0).toFixed(1)}%</td><td style="color:#22c55e;font-weight:700">+${Math.max(0, potential)} clicks</td></tr>`;
      }).join('')}
    </tbody>
  </table>
  ` : ''}

  ${topByImpressions.length > 0 ? `
  <h2>High Impression Keywords</h2>
  <p>Keywords with the highest visibility — large audiences seeing ${name} in search results.</p>
  <table>
    <thead><tr><th>Keyword</th><th>Impressions</th><th>Position</th><th>Clicks</th><th>CTR</th></tr></thead>
    <tbody>
      ${topByImpressions.map((k: any) => `<tr><td><strong>${k.query}</strong></td><td><strong>${(k.impressions || 0).toLocaleString()}</strong></td><td>#${Math.round(k.position || 0)}</td><td>${k.clicks || 0}</td><td>${(k.ctr || 0).toFixed(2)}%</td></tr>`).join('')}
    </tbody>
  </table>
  ` : ''}

  <h2>Strategic Recommendations</h2>
  ${[
    quickWins.length > 0 ? { n: 1, title: `Optimise ${quickWins.length} Quick Win Keywords`, body: `Keywords like "${quickWins[0]?.query}"${quickWins[1] ? ` and "${quickWins[1]?.query}"` : ''} are ranking on page 1 but have low CTR (below 3%). Rewrite the meta titles and descriptions for these pages to be more compelling and click-worthy. A 2–3x CTR improvement is realistic and could add ${quickWins.reduce((s: number, k: any) => s + Math.max(0, Math.round((k.impressions || 0) * 0.05 - (k.clicks || 0))), 0).toLocaleString()} additional clicks per month.` } : null,
    top3.length > 0 ? { n: 2, title: `Protect Top 3 Rankings`, body: `${name} currently holds ${top3.length} keywords in positions 1–3. These rankings drive the highest click-through rates (typically 25–40%). Maintain these with regular content freshness updates, internal linking, and ensuring page speed remains optimal.` } : null,
    lowCTR.length > 0 ? { n: 3, title: `Fix Low CTR High-Impression Pages`, body: `${lowCTR.length} keywords have high impressions but under 1% CTR. These pages are visible but not compelling users to click. Review and rewrite title tags to include power words, numbers, or emotional hooks relevant to the searcher's intent.` } : null,
    page2.length > 0 ? { n: 4, title: `Push ${page2.length} Page 2 Keywords to Page 1`, body: `${page2.length} keywords are ranking on page 2 (positions 11–20). These are the highest-leverage SEO opportunities — a small ranking improvement moves them to page 1 where 90%+ of clicks happen. Add more depth, examples, and semantic keywords to these pages.` } : null,
  ].filter(Boolean).map((r: any) => `<div class="rec"><div class="rec-num">${r.n}</div><div><div class="rec-title">${r.title}</div><div class="rec-body">${r.body}</div></div></div>`).join('')}

</div>

<div class="footer">
  <span class="footer-brand">Lumnix · Marketing Intelligence</span>
  <span class="footer-note">Confidential · Prepared for ${name} · ${generated}</span>
</div>
</body>
</html>`;
}

function buildAnalyticsReport(
  overviewData: { date: string; sessions: number; users: number; pageviews: number }[],
  sourcesData: { source: string; sessions: number; users: number }[],
  pagesData: { page: string; pageviews: number; bounceRate: number }[],
  workspace: any,
  periodLabel?: string
): string {
  const name = workspace?.name || 'Your Brand';
  const period = periodLabel || getPeriodLabel(30);
  const generated = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Aggregate from overview rows
  const totalSessions = overviewData.reduce((s, r) => s + (r.sessions || 0), 0);
  const totalUsers = overviewData.reduce((s, r) => s + (r.users || 0), 0);
  const totalNewUsers = 0; // not available in overview aggregation
  const returningUsers = 0;

  // Top sources from sourcesData
  const topSources: [string, number][] = sourcesData
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8)
    .map(s => [s.source, s.sessions]);

  // Top pages from pagesData
  const topPages: [string, number][] = pagesData
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, 15)
    .map(p => [p.page, p.pageviews]);

  // Daily trend — last 14 days from overviewData
  const dailyData = [...overviewData]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map(r => [r.date, r.sessions] as [string, number]);
  const maxVal = Math.max(...dailyData.map(([, v]) => v), 1);
  const avgDaily = totalSessions > 0 ? Math.round(totalSessions / 30) : 0;

  const topSource = topSources[0]?.[0] || 'organic';
  const topSourcePct = totalSessions > 0 ? ((topSources[0]?.[1] || 0) / totalSessions * 100).toFixed(0) : '0';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${name} — Traffic & Analytics Report</title>
<style>
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111827; }
  .cover { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); min-height: 260px; padding: 48px; display: flex; flex-direction: column; justify-content: space-between; }
  .cover-brand { display: flex; align-items: center; gap: 12px; }
  .cover-dot { width: 10px; height: 10px; border-radius: 50%; background: #3b82f6; }
  .cover-lumnix { font-size: 15px; font-weight: 700; color: #93c5fd; letter-spacing: 1px; text-transform: uppercase; }
  .cover-title { font-size: 36px; font-weight: 900; color: #fff; line-height: 1.15; letter-spacing: -1px; margin-top: 24px; }
  .cover-sub { font-size: 16px; color: #94a3b8; margin-top: 8px; }
  .cover-meta { display: flex; gap: 24px; margin-top: 32px; }
  .cover-meta-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
  .cover-meta-val { font-size: 14px; color: #e2e8f0; font-weight: 600; }
  .body { padding: 40px 48px; }
  h2 { font-size: 13px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 1.5px; margin: 36px 0 16px; display: flex; align-items: center; gap: 8px; }
  h2::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
  p { font-size: 14px; color: #374151; line-height: 1.7; margin-bottom: 10px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
  .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
  .kpi-val { font-size: 28px; font-weight: 800; color: #111827; letter-spacing: -1px; }
  .kpi-label { font-size: 12px; color: #6b7280; margin-top: 4px; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead { background: #f1f5f9; }
  th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
  td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #374151; font-size: 13px; }
  .bar-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
  .bar-label { font-size: 13px; color: #374151; width: 140px; flex-shrink: 0; font-weight: 500; text-transform: capitalize; }
  .bar-track { flex: 1; background: #f1f5f9; border-radius: 4px; height: 8px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; background: #3b82f6; }
  .bar-val { font-size: 13px; font-weight: 700; color: #111827; width: 60px; text-align: right; }
  .bar-pct { font-size: 12px; color: #9ca3af; width: 40px; text-align: right; }
  .spark { display: flex; align-items: flex-end; gap: 3px; height: 60px; padding: 8px 0; }
  .spark-bar { flex: 1; background: #dbeafe; border-radius: 3px 3px 0 0; position: relative; min-width: 12px; }
  .spark-bar.above { background: #3b82f6; }
  .rec { display: flex; gap: 14px; padding: 16px; border-radius: 10px; border: 1px solid #e5e7eb; margin-bottom: 10px; background: #fafafa; }
  .rec-num { width: 28px; height: 28px; border-radius: 8px; background: #dbeafe; color: #1d4ed8; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rec-title { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px; }
  .rec-body { font-size: 13px; color: #6b7280; line-height: 1.6; }
  .highlight-box { background: linear-gradient(135deg, #eff6ff, #f0fdf4); border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px 24px; margin: 16px 0; }
  .highlight-box p { color: #374151; font-size: 14px; line-height: 1.75; }
  .footer { background: #f8fafc; border-top: 2px solid #e2e8f0; padding: 20px 48px; display: flex; justify-content: space-between; align-items: center; margin-top: 48px; }
  .footer-brand { font-size: 13px; font-weight: 700; color: #3b82f6; }
  .footer-note { font-size: 12px; color: #9ca3af; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-brand"><div class="cover-dot"></div><span class="cover-lumnix">Lumnix · Marketing Intelligence</span></div>
  <div>
    <div class="cover-title">Traffic & Analytics Report<br>${name}</div>
    <div class="cover-sub">Sessions, Users, Traffic Sources & Engagement Analysis</div>
    <div class="cover-meta">
      <div class="cover-meta-item"><div class="cover-meta-label">Reporting Period</div><div class="cover-meta-val">${period}</div></div>
      <div class="cover-meta-item"><div class="cover-meta-label">Generated</div><div class="cover-meta-val">${generated}</div></div>
      <div class="cover-meta-item"><div class="cover-meta-label">Avg Daily Sessions</div><div class="cover-meta-val">${avgDaily.toLocaleString()}</div></div>
    </div>
  </div>
</div>

<div class="body">

  <h2>Executive Summary</h2>
  <div class="highlight-box">
    <p><strong>${name}</strong> recorded <strong>${totalSessions.toLocaleString()} sessions</strong> and <strong>${totalUsers.toLocaleString()} users</strong> during the 30-day reporting period, averaging <strong>${avgDaily.toLocaleString()} sessions per day</strong>. ${totalNewUsers > 0 ? `The site attracted <strong>${totalNewUsers.toLocaleString()} new users</strong>, with <strong>${returningUsers > 0 ? returningUsers.toLocaleString() : 'several'} returning users</strong> — indicating ${returningUsers / Math.max(totalUsers, 1) > 0.3 ? 'a healthy level of audience retention' : 'room to grow audience loyalty and return visit rates'}.` : ''} ${topSources.length > 0 ? `The primary traffic source is <strong>${topSource}</strong>, contributing ${topSourcePct}% of total sessions.` : ''}</p>
  </div>

  <h2>Traffic Overview</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-val">${totalSessions.toLocaleString()}</div><div class="kpi-label">Total Sessions</div></div>
    <div class="kpi"><div class="kpi-val">${totalUsers.toLocaleString()}</div><div class="kpi-label">Total Users</div></div>
    <div class="kpi"><div class="kpi-val">${totalNewUsers.toLocaleString()}</div><div class="kpi-label">New Users</div></div>
    <div class="kpi"><div class="kpi-val">${avgDaily.toLocaleString()}</div><div class="kpi-label">Avg Daily Sessions</div></div>
  </div>

  ${dailyData.length > 0 ? `
  <h2>14-Day Traffic Trend</h2>
  <p>Daily session volume over the last 14 days. The average line represents the 30-day daily average of ${avgDaily.toLocaleString()} sessions.</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-top:8px">
    <div class="spark">
      ${dailyData.map(([date, val]) => {
        const h = Math.round((val / maxVal) * 100);
        const isAbove = val >= avgDaily;
        const d = new Date(date);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="flex:1;width:100%;display:flex;align-items:flex-end">
            <div style="width:100%;height:${h}%;background:${isAbove ? '#3b82f6' : '#bfdbfe'};border-radius:3px 3px 0 0;min-height:4px"></div>
          </div>
          <div style="font-size:9px;color:#9ca3af;white-space:nowrap">${label}</div>
          <div style="font-size:10px;font-weight:700;color:#374151">${val}</div>
        </div>`;
      }).join('')}
    </div>
  </div>
  ` : ''}

  ${topSources.length > 0 ? `
  <h2>Traffic Sources</h2>
  <p>Where ${name}'s visitors are coming from during the reporting period.</p>
  <div style="margin-top:8px">
    ${topSources.map(([src, val]) => {
      const pct = totalSessions > 0 ? ((val / totalSessions) * 100).toFixed(1) : '0';
      return `<div class="bar-row">
        <div class="bar-label">${src || 'direct'}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="bar-val">${val.toLocaleString()}</div>
        <div class="bar-pct">${pct}%</div>
      </div>`;
    }).join('')}
  </div>
  ` : ''}

  ${topPages.length > 0 ? `
  <h2>Top Pages by Sessions</h2>
  <p>Highest-traffic pages on ${name}'s website during the reporting period.</p>
  <table>
    <thead><tr><th>#</th><th>Page</th><th>Sessions</th><th>Share of Traffic</th></tr></thead>
    <tbody>
      ${topPages.map(([page, val], i) => {
        const pct = totalSessions > 0 ? ((val / totalSessions) * 100).toFixed(1) : '0';
        return `<tr><td style="color:#9ca3af;font-size:12px">${i + 1}</td><td><strong>${page}</strong></td><td><strong>${val.toLocaleString()}</strong></td><td><div style="display:flex;align-items:center;gap:8px"><div style="width:${Math.round((val/topPages[0][1])*80)}px;height:6px;background:#bfdbfe;border-radius:3px"></div><span style="color:#6b7280;font-size:12px">${pct}%</span></div></td></tr>`;
      }).join('')}
    </tbody>
  </table>
  ` : ''}

  <h2>Strategic Recommendations</h2>
  ${[
    topSources.length > 0 ? { n: 1, title: `Diversify Beyond ${topSource}`, body: `${topSourcePct}% of traffic comes from ${topSource}. Over-reliance on a single source creates risk. Invest in building 2–3 complementary channels — ${topSource === 'google' ? 'email marketing and social media' : 'organic search and email marketing'} — to create a more resilient traffic mix.` } : null,
    avgDaily > 0 ? { n: 2, title: `Improve Session-to-Lead Conversion`, body: `With ${avgDaily.toLocaleString()} daily sessions, even a 1% conversion rate improvement means measurably more leads. Review top-traffic pages for clear CTAs, lead magnets, and friction-free contact options.` } : null,
    totalNewUsers > 0 && returningUsers / Math.max(totalUsers, 1) < 0.3 ? { n: 3, title: `Increase Return Visit Rate`, body: `Currently ${((returningUsers / Math.max(totalUsers, 1)) * 100).toFixed(0)}% of users return. Industry benchmarks suggest 30–40%+ is achievable. Email newsletters, retargeting, and push notifications can bring visitors back consistently.` } : null,
    topPages.length > 3 ? { n: 4, title: `Optimise Top 3 Pages for Conversions`, body: `Pages "${topPages[0]?.[0]}", "${topPages[1]?.[0]}", and "${topPages[2]?.[0]}" drive the most traffic. A/B test headlines, CTAs, and page layouts on these pages — small improvements here have outsized impact on overall performance.` } : null,
  ].filter(Boolean).map((r: any) => `<div class="rec"><div class="rec-num">${r.n}</div><div><div class="rec-title">${r.title}</div><div class="rec-body">${r.body}</div></div></div>`).join('')}

</div>

<div class="footer">
  <span class="footer-brand">Lumnix · Marketing Intelligence</span>
  <span class="footer-note">Confidential · Prepared for ${name} · ${generated}</span>
</div>
</body>
</html>`;
}

function buildFullReport(
  gscKeywords: any[],
  overviewData: { date: string; sessions: number; users: number; pageviews: number }[],
  sourcesData: { source: string; sessions: number; users: number }[],
  pagesData: { page: string; pageviews: number; bounceRate: number }[],
  workspace: any,
  periodLabel?: string
): string {
  const name = workspace?.name || 'Your Brand';
  const period = periodLabel || getPeriodLabel(30);
  const generated = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const totalClicks = gscKeywords.reduce((s: number, k: any) => s + (k.clicks || 0), 0);
  const totalImpressions = gscKeywords.reduce((s: number, k: any) => s + (k.impressions || 0), 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const avgPos = gscKeywords.length > 0 ? (gscKeywords.reduce((s: number, k: any) => s + (k.position || 0), 0) / gscKeywords.length).toFixed(1) : 'N/A';
  const top3 = gscKeywords.filter((k: any) => k.position <= 3);
  const page1 = gscKeywords.filter((k: any) => k.position <= 10);
  const quickWins = gscKeywords.filter((k: any) => k.position >= 4 && k.position <= 10 && (k.ctr || 0) < 3);
  const topKeywords = [...gscKeywords].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 15);

  const totalSessions = overviewData.reduce((s, r) => s + (r.sessions || 0), 0);
  const totalUsers = overviewData.reduce((s, r) => s + (r.users || 0), 0);
  const avgDaily = totalSessions > 0 ? Math.round(totalSessions / 30) : 0;

  const topSources: [string, number][] = sourcesData
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 6)
    .map(s => [s.source, s.sessions]);

  const topPages: [string, number][] = pagesData
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, 10)
    .map(p => [p.page, p.pageviews]);

  const overallScore = Math.min(100, Math.round(
    (page1.length / Math.max(gscKeywords.length, 1) * 30) +
    (Math.min(totalClicks / 500, 1) * 20) +
    (Math.min(totalSessions / 1000, 1) * 20) +
    (top3.length > 0 ? 15 : 0) +
    (quickWins.length > 0 ? 15 : 0)
  ));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${name} — Full Marketing Intelligence Report</title>
<style>
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111827; }
  .cover { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f2c2c 100%); min-height: 320px; padding: 48px; display: flex; flex-direction: column; justify-content: space-between; }
  .cover-brand { display: flex; align-items: center; gap: 12px; }
  .cover-dot { width: 10px; height: 10px; border-radius: 50%; background: #22c55e; }
  .cover-lumnix { font-size: 15px; font-weight: 700; color: #86efac; letter-spacing: 1px; text-transform: uppercase; }
  .cover-title { font-size: 40px; font-weight: 900; color: #fff; line-height: 1.1; letter-spacing: -1.5px; margin-top: 32px; }
  .cover-client { font-size: 22px; color: #a78bfa; font-weight: 700; margin-top: 6px; }
  .cover-sub { font-size: 15px; color: #94a3b8; margin-top: 8px; }
  .cover-meta { display: flex; gap: 32px; margin-top: 36px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); }
  .cover-meta-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
  .cover-meta-val { font-size: 14px; color: #e2e8f0; font-weight: 600; }
  .score-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); border-radius: 10px; padding: 8px 16px; margin-top: 20px; }
  .score-val { font-size: 24px; font-weight: 900; color: #22c55e; }
  .score-label { font-size: 13px; color: #86efac; }
  .body { padding: 40px 48px; }
  h2 { font-size: 13px; font-weight: 700; color: #22c55e; text-transform: uppercase; letter-spacing: 1.5px; margin: 40px 0 16px; display: flex; align-items: center; gap: 8px; }
  h2::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
  h3 { font-size: 15px; font-weight: 700; color: #374151; margin: 20px 0 8px; }
  p { font-size: 14px; color: #374151; line-height: 1.75; margin-bottom: 12px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 16px 0; }
  .metric-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
  .metric-block-title { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
  .metric-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
  .metric-row:last-child { border-bottom: none; }
  .metric-key { font-size: 13px; color: #6b7280; }
  .metric-val { font-size: 14px; font-weight: 700; color: #111827; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead { background: #f1f5f9; }
  th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
  td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #374151; }
  .tag { font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 700; display: inline-block; }
  .tag-top3 { background: #dcfce7; color: #15803d; }
  .tag-win { background: #ede9fe; color: #6d28d9; }
  .tag-ctr { background: #fef3c7; color: #92400e; }
  .opp { background: linear-gradient(135deg, #faf5ff, #f0fdf4); border-left: 4px solid #22c55e; border-radius: 0 10px 10px 0; padding: 16px 20px; margin-bottom: 12px; }
  .opp-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 4px; }
  .opp-meta { font-size: 12px; color: #9ca3af; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .opp-body { font-size: 13px; color: #6b7280; line-height: 1.6; }
  .rec { display: flex; gap: 14px; padding: 18px 20px; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 12px; background: #fafafa; }
  .rec-num { width: 32px; height: 32px; border-radius: 10px; background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rec-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 6px; }
  .rec-body { font-size: 13px; color: #6b7280; line-height: 1.65; }
  .rec-impact { font-size: 11px; color: #22c55e; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; }
  .highlight-box { background: linear-gradient(135deg, #f0fdf4, #faf5ff); border: 1px solid #bbf7d0; border-radius: 12px; padding: 22px 26px; margin: 16px 0; }
  .highlight-box p { color: #374151; font-size: 14px; line-height: 1.8; }
  .bar-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
  .bar-label { font-size: 13px; color: #374151; width: 130px; flex-shrink: 0; font-weight: 500; text-transform: capitalize; }
  .bar-track { flex: 1; background: #f1f5f9; border-radius: 4px; height: 8px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #7c3aed, #22c55e); }
  .bar-val { font-size: 13px; font-weight: 700; color: #111827; width: 60px; text-align: right; }
  .bar-pct { font-size: 12px; color: #9ca3af; width: 40px; text-align: right; }
  .divider { border: none; border-top: 2px dashed #e5e7eb; margin: 36px 0; }
  .footer { background: linear-gradient(135deg, #0f172a, #1e1b4b); padding: 24px 48px; display: flex; justify-content: space-between; align-items: center; margin-top: 48px; }
  .footer-brand { font-size: 14px; font-weight: 800; color: #a78bfa; }
  .footer-note { font-size: 12px; color: #64748b; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-brand"><div class="cover-dot"></div><span class="cover-lumnix">Lumnix · Marketing Intelligence</span></div>
  <div>
    <div class="cover-title">Full Marketing Intelligence Report</div>
    <div class="cover-client">${name}</div>
    <div class="cover-sub">SEO Performance · Traffic Analytics · Strategic Recommendations</div>
    <div class="score-badge"><span class="score-val">${overallScore}/100</span><span class="score-label">Overall Marketing Score</span></div>
    <div class="cover-meta">
      <div class="cover-meta-item"><div class="cover-meta-label">Reporting Period</div><div class="cover-meta-val">${period}</div></div>
      <div class="cover-meta-item"><div class="cover-meta-label">Generated</div><div class="cover-meta-val">${generated}</div></div>
      <div class="cover-meta-item"><div class="cover-meta-label">Data Sources</div><div class="cover-meta-val">Google Search Console · Google Analytics 4</div></div>
    </div>
  </div>
</div>

<div class="body">

  <h2>Executive Summary</h2>
  <div class="highlight-box">
    <p>This report provides a comprehensive analysis of <strong>${name}</strong>'s digital marketing performance for the period <strong>${period}</strong>. Data was sourced directly from Google Search Console and Google Analytics 4.</p>
    <p style="margin-top:8px">During this period, <strong>${name}</strong> generated <strong>${totalClicks.toLocaleString()} organic clicks</strong> from <strong>${totalImpressions.toLocaleString()} search impressions</strong>, with an average CTR of <strong>${avgCTR}%</strong>. Simultaneously, the website recorded <strong>${totalSessions.toLocaleString()} sessions</strong> and <strong>${totalUsers.toLocaleString()} users</strong>, averaging <strong>${avgDaily.toLocaleString()} sessions per day</strong>.</p>
    <p style="margin-top:8px">Key strengths: <strong>${top3.length} keywords in top 3 positions</strong> and <strong>${page1.length} keywords ranking on page 1</strong>. Key opportunity: <strong>${quickWins.length} quick-win keywords</strong> that could deliver additional clicks with title/description optimisation alone.</p>
  </div>

  <hr class="divider">

  <h2>SEO Performance</h2>
  <div class="two-col">
    <div class="metric-block">
      <div class="metric-block-title">Search Visibility</div>
      <div class="metric-row"><span class="metric-key">Organic Clicks</span><span class="metric-val">${totalClicks.toLocaleString()}</span></div>
      <div class="metric-row"><span class="metric-key">Impressions</span><span class="metric-val">${totalImpressions.toLocaleString()}</span></div>
      <div class="metric-row"><span class="metric-key">Avg CTR</span><span class="metric-val">${avgCTR}%</span></div>
      <div class="metric-row"><span class="metric-key">Avg Position</span><span class="metric-val">#${avgPos}</span></div>
    </div>
    <div class="metric-block">
      <div class="metric-block-title">Ranking Distribution</div>
      <div class="metric-row"><span class="metric-key">Top 3 positions</span><span class="metric-val" style="color:#22c55e">${top3.length} keywords</span></div>
      <div class="metric-row"><span class="metric-key">Page 1 (top 10)</span><span class="metric-val" style="color:#3b82f6">${page1.length} keywords</span></div>
      <div class="metric-row"><span class="metric-key">Page 2 (11–20)</span><span class="metric-val" style="color:#f59e0b">${gscKeywords.filter((k: any) => k.position > 10 && k.position <= 20).length} keywords</span></div>
      <div class="metric-row"><span class="metric-key">Total tracked</span><span class="metric-val">${gscKeywords.length} keywords</span></div>
    </div>
  </div>

  <h3>Top Performing Keywords</h3>
  <table>
    <thead><tr><th>#</th><th>Keyword</th><th>Position</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Signal</th></tr></thead>
    <tbody>
      ${topKeywords.map((k: any, i: number) => {
        const sig = k.position <= 3 ? '<span class="tag tag-top3">Top 3</span>'
          : (k.position >= 4 && k.position <= 10 && (k.ctr || 0) < 3) ? '<span class="tag tag-win">Quick Win</span>'
          : ((k.impressions || 0) > 200 && (k.ctr || 0) < 1) ? '<span class="tag tag-ctr">Low CTR</span>' : '';
        return `<tr><td style="color:#9ca3af;font-size:11px">${i + 1}</td><td><strong>${k.query}</strong></td><td>#${Math.round(k.position || 0)}</td><td><strong>${k.clicks || 0}</strong></td><td>${(k.impressions || 0).toLocaleString()}</td><td>${(k.ctr || 0).toFixed(1)}%</td><td>${sig}</td></tr>`;
      }).join('')}
    </tbody>
  </table>

  <hr class="divider">

  <h2>Traffic Analytics</h2>
  <div class="two-col">
    <div class="metric-block">
      <div class="metric-block-title">Audience Overview</div>
      <div class="metric-row"><span class="metric-key">Total Sessions</span><span class="metric-val">${totalSessions.toLocaleString()}</span></div>
      <div class="metric-row"><span class="metric-key">Total Users</span><span class="metric-val">${totalUsers.toLocaleString()}</span></div>
      <div class="metric-row"><span class="metric-key">Avg Daily Sessions</span><span class="metric-val">${avgDaily.toLocaleString()}</span></div>
    </div>
    ${topSources.length > 0 ? `
    <div class="metric-block">
      <div class="metric-block-title">Top Traffic Sources</div>
      ${topSources.slice(0, 5).map(([src, val]) => `<div class="metric-row"><span class="metric-key" style="text-transform:capitalize">${src || 'direct'}</span><span class="metric-val">${val.toLocaleString()} <span style="color:#9ca3af;font-weight:400;font-size:12px">(${totalSessions > 0 ? ((val / totalSessions) * 100).toFixed(0) : 0}%)</span></span></div>`).join('')}
    </div>` : '<div></div>'}
  </div>

  ${topSources.length > 0 ? `
  <h3>Traffic Source Breakdown</h3>
  ${topSources.map(([src, val]) => {
    const pct = totalSessions > 0 ? ((val / totalSessions) * 100).toFixed(1) : '0';
    return `<div class="bar-row"><div class="bar-label">${src || 'direct'}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-val">${val.toLocaleString()}</div><div class="bar-pct">${pct}%</div></div>`;
  }).join('')}
  ` : ''}

  ${topPages.length > 0 ? `
  <h3>Top Pages by Traffic</h3>
  <table>
    <thead><tr><th>#</th><th>Page</th><th>Sessions</th><th>% of Total</th></tr></thead>
    <tbody>
      ${topPages.map(([page, val], i) => {
        const pct = totalSessions > 0 ? ((val / totalSessions) * 100).toFixed(1) : '0';
        return `<tr><td style="color:#9ca3af;font-size:11px">${i + 1}</td><td><strong>${page}</strong></td><td><strong>${val.toLocaleString()}</strong></td><td>${pct}%</td></tr>`;
      }).join('')}
    </tbody>
  </table>
  ` : ''}

  <hr class="divider">

  <h2>Opportunities & Quick Wins</h2>

  ${quickWins.length > 0 ? `
  <div class="opp">
    <div class="opp-meta">High Priority · SEO</div>
    <div class="opp-title">⚡ ${quickWins.length} Keywords Ready for CTR Improvement</div>
    <div class="opp-body">The following keywords rank on page 1 (positions 4–10) but have below-average CTR. Rewriting meta titles and descriptions could add an estimated ${quickWins.reduce((s: number, k: any) => s + Math.max(0, Math.round((k.impressions || 0) * 0.05 - (k.clicks || 0))), 0).toLocaleString()}+ additional clicks per month without any ranking improvement needed.</div>
  </div>
  <table style="margin-bottom:24px">
    <thead><tr><th>Keyword</th><th>Position</th><th>Current CTR</th><th>Impressions</th><th>Estimated Gain</th></tr></thead>
    <tbody>
      ${quickWins.slice(0, 8).map((k: any) => {
        const gain = Math.max(0, Math.round((k.impressions || 0) * 0.05 - (k.clicks || 0)));
        return `<tr><td><strong>${k.query}</strong></td><td>#${Math.round(k.position)}</td><td style="color:#f59e0b;font-weight:700">${(k.ctr || 0).toFixed(1)}%</td><td>${(k.impressions || 0).toLocaleString()}</td><td style="color:#22c55e;font-weight:700">+${gain} clicks/mo</td></tr>`;
      }).join('')}
    </tbody>
  </table>
  ` : ''}

  <hr class="divider">

  <h2>Strategic Recommendations</h2>
  <p>Based on the data analysis above, the following recommendations are prioritised by potential impact for <strong>${name}</strong>.</p>

  ${[
    quickWins.length > 0 ? {
      n: 1,
      title: `Optimise ${quickWins.length} Quick Win Keywords`,
      body: `Keywords ranking positions 4–10 with low CTR are your highest-leverage opportunity. Rewrite title tags and meta descriptions for these pages to be more compelling and match searcher intent. Focus especially on: ${quickWins.slice(0, 3).map((k: any) => `"${k.query}"`).join(', ')}.`,
      impact: 'Expected Impact: +' + quickWins.reduce((s: number, k: any) => s + Math.max(0, Math.round((k.impressions || 0) * 0.05 - (k.clicks || 0))), 0).toLocaleString() + ' clicks/month',
    } : null,
    top3.length > 0 ? {
      n: 2,
      title: `Protect & Strengthen Top 3 Rankings`,
      body: `${name} holds ${top3.length} keywords in the top 3 positions — these drive the majority of organic clicks. Maintain these with bi-monthly content freshness reviews, strong internal linking, and monitoring for competitor movements.`,
      impact: 'Risk Level: High if neglected — protect proactively',
    } : null,
    totalSessions > 0 ? {
      n: 3,
      title: `Convert Traffic into Leads`,
      body: `With ${totalSessions.toLocaleString()} monthly sessions and ${avgDaily.toLocaleString()} daily visitors, the traffic foundation is in place. The next lever is conversion rate optimisation — clear CTAs on high-traffic pages, lead magnets, and streamlined contact/booking flows.`,
      impact: 'Expected Impact: 1–3% CRO improvement = meaningful lead volume increase',
    } : null,
    gscKeywords.filter((k: any) => k.position > 10 && k.position <= 20).length > 0 ? {
      n: 4,
      title: `Push Page 2 Keywords to Page 1`,
      body: `${gscKeywords.filter((k: any) => k.position > 10 && k.position <= 20).length} keywords are one step from page 1. These are the most cost-effective SEO investments. Add depth, FAQs, and semantic keywords to these pages. Page 1 rankings can increase clicks by 10–100x versus page 2.`,
      impact: 'Timeline: 4–8 weeks with focused content updates',
    } : null,
    topSources.length > 0 && topSources[0]?.[1] / Math.max(totalSessions, 1) > 0.6 ? {
      n: 5,
      title: `Reduce Single-Source Traffic Dependency`,
      body: `${((topSources[0][1] / totalSessions) * 100).toFixed(0)}% of traffic comes from ${topSources[0][0]}. This concentration creates business risk. Build complementary channels — email, social, and content marketing — to create a resilient, diversified traffic mix.`,
      impact: 'Strategic: Reduces algorithm/platform risk significantly',
    } : null,
  ].filter(Boolean).map((r: any) => `
    <div class="rec">
      <div class="rec-num">${r.n}</div>
      <div>
        <div class="rec-title">${r.title}</div>
        <div class="rec-body">${r.body}</div>
        <div class="rec-impact">${r.impact}</div>
      </div>
    </div>
  `).join('')}

</div>

<div class="footer">
  <span class="footer-brand">Lumnix · Marketing Intelligence</span>
  <span class="footer-note">Confidential · Prepared for ${name} · ${generated}</span>
</div>
</body>
</html>`;
}

function openReport(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => setTimeout(() => win.print(), 600);
  }
}

// Load jsPDF + html2canvas via CDN at runtime (avoids SSR bundling issues)
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = () => resolve(); s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function downloadPDF(html: string, filename: string) {
  const pdfFilename = filename.replace(/\.html$/, '.pdf');

  // Load libs from CDN — bypasses Next.js SSR bundling entirely
  await Promise.all([
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
  ]);

  return new Promise<void>((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1px;border:none;visibility:hidden;';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) { document.body.removeChild(iframe); resolve(); return; }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    const capture = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const h2c = (window as any).html2canvas;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { jsPDF } = (window as any).jspdf;

        const body = iframeDoc.body;
        iframe.style.height = body.scrollHeight + 'px';

        const canvas = await h2c(body, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: 794,
          width: 794,
          logging: false,
          allowTaint: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pageW = 794;
        const pageH = Math.round((canvas.height / canvas.width) * pageW);

        const pdf = new jsPDF({ unit: 'px', format: [pageW, pageH], orientation: 'portrait' });
        pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH);
        pdf.save(pdfFilename);
      } catch (e) {
        console.error('PDF generation failed:', e);
      } finally {
        document.body.removeChild(iframe);
        resolve();
      }
    };

    iframe.onload = () => setTimeout(capture, 1500);
    setTimeout(() => { if (document.body.contains(iframe)) capture(); }, 2500);
  });
}

export default function ReportsPage() {
  const { workspace } = useWorkspaceCtx();
  const { c } = useTheme();

  // Date range state
  const [selectedPreset, setSelectedPreset] = useState(2); // default: Last 30 days
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const dateRange = useMemo((): DateRangeParams => {
    const preset = DATE_PRESETS[selectedPreset];
    if (preset.days === 0 && customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }
    return { days: preset.days || 30 };
  }, [selectedPreset, customStart, customEnd]);

  const periodLabel = useMemo(() => {
    if (dateRange.startDate && dateRange.endDate) {
      const s = new Date(dateRange.startDate);
      const e = new Date(dateRange.endDate);
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    const days = dateRange.days || 30;
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [dateRange]);

  const { data: gscResp, loading: gscLoading } = useGSCData(workspace?.id, 'keywords', dateRange);
  const { data: ga4Overview, loading: ga4Loading } = useGA4Data(workspace?.id, 'overview', dateRange);
  const { data: ga4Sources } = useGA4Data(workspace?.id, 'sources', dateRange);
  const { data: ga4Pages } = useGA4Data(workspace?.id, 'pages', dateRange);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Set<string>>(new Set());

  const loading = gscLoading || ga4Loading;
  const gscKeywords = gscResp?.keywords || [];
  const overviewData: { date: string; sessions: number; users: number; pageviews: number }[] = ga4Overview?.data || [];
  const sourcesData: { source: string; sessions: number; users: number }[] = ga4Sources?.data || [];
  const pagesData: { page: string; pageviews: number; bounceRate: number }[] = ga4Pages?.data || [];
  const hasGA4 = overviewData.length > 0 || sourcesData.length > 0;
  const hasData = gscKeywords.length > 0 || hasGA4;

  async function handleGenerate(type: string, format: 'print' | 'download') {
    setGenerating(`${type}-${format}`);
    await new Promise(r => setTimeout(r, 600));

    const date = new Date().toISOString().slice(0, 10);
    const clientName = workspace?.name || 'report';

    let html = '';
    let filename = '';

    if (type === 'seo') {
      html = buildSEOReport(gscKeywords, workspace, periodLabel);
      filename = `${clientName}-seo-report-${date}.html`;
    } else if (type === 'analytics') {
      html = buildAnalyticsReport(overviewData, sourcesData, pagesData, workspace, periodLabel);
      filename = `${clientName}-analytics-report-${date}.html`;
    } else {
      html = buildFullReport(gscKeywords, overviewData, sourcesData, pagesData, workspace, periodLabel);
      filename = `${clientName}-full-marketing-report-${date}.html`;
    }

    if (format === 'print') {
      openReport(html, filename);
    } else {
      await downloadPDF(html, filename);
    }

    setGenerated(prev => new Set([...prev, `${type}-${format}`]));
    setGenerating(null);
  }

  return (
    <PageShell title="Reports" description="Client-ready marketing reports with real data and AI insights" icon={FileText} badge="Client-Ready">
      {/* ── Date Range Picker ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.textSecondary, fontSize: 13, fontWeight: 600 }}>
          <Calendar size={15} />
          Reporting Period:
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowPresetMenu(p => !p); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 9,
              backgroundColor: c.bgInput, border: `1px solid ${c.border}`,
            color: c.text, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <span>{DATE_PRESETS[selectedPreset].days === 0 && customStart ? `${customStart} → ${customEnd}` : DATE_PRESETS[selectedPreset].label}</span>
            <ChevronDown size={13} color={c.textMuted} />
          </button>
          {showPresetMenu && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, zIndex: 50,
              backgroundColor: c.bgCard, border: `1px solid ${c.border}`,
              borderRadius: 10, overflow: 'hidden', minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {DATE_PRESETS.map((p, i) => (
                <button key={i} onClick={() => {
                  setSelectedPreset(i);
                  setShowPresetMenu(false);
                  if (p.days === 0) setShowCustom(true);
                  else setShowCustom(false);
                }} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 16px', fontSize: 13, fontWeight: 500,
                  color: selectedPreset === i ? '#7c3aed' : c.text,
                  backgroundColor: selectedPreset === i ? 'rgba(124,58,237,0.1)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                }}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {showCustom && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              style={{
                padding: '7px 10px', borderRadius: 8, border: '1px solid #3f3f46',
                backgroundColor: c.bgInput, color: c.text, fontSize: 13,
              }}
            />
            <span style={{ color: c.textMuted, fontSize: 13 }}>→</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              style={{
                padding: '7px 10px', borderRadius: 8, border: '1px solid #3f3f46',
                backgroundColor: c.bgInput, color: c.text, fontSize: 13,
              }}
            />
          </div>
        )}

        {loading && <Loader2 size={14} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />}
        {!loading && hasData && (
          <span style={{ fontSize: 12, color: c.textMuted }}>
            {periodLabel}
          </span>
        )}
      </div>

      {!hasData && !loading && (
        <div style={{ padding: 32, borderRadius: 14, backgroundColor: c.bgCard, border: `1px solid ${c.border}`, textAlign: 'center', marginBottom: 24 }}>
          <FileText size={32} color="#334155" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No data connected yet</p>
          <p style={{ fontSize: 13, color: c.textSecondary, marginBottom: 14 }}>Connect and sync GSC or GA4 to generate branded reports with real data</p>
          <a href="/dashboard/settings" style={{ fontSize: 13, color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }}>Connect integrations →</a>
        </div>
      )}

      {hasData && (
        <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 13, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Sparkles size={14} />
          <span>Data loaded — {gscKeywords.length} keywords from GSC · {hasGA4 ? 'GA4 traffic data' : 'No GA4 data'} · Reports will include {workspace?.name || 'your brand name'}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
        {reportTypes.map(rt => {
          const Icon = rt.icon;
          return (
            <div key={rt.id} style={{ backgroundColor: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${rt.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={rt.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 2 }}>{rt.label}</h3>
                  <p style={{ fontSize: 12, color: c.textMuted, margin: 0 }}>{rt.desc}</p>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                {rt.sections.map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: `1px solid ${c.borderSubtle}`, fontSize: 12, color: c.textSecondary }}>
                    <CheckCircle2 size={11} color={c.textMuted} />
                    {s}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleGenerate(rt.id, 'print')}
                  disabled={!!generating || loading || !hasData}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '11px', borderRadius: 9, border: 'none',
                    background: `linear-gradient(135deg, ${rt.color}, ${rt.color}cc)`,
                    color: 'white', fontSize: 13, fontWeight: 700,
                    cursor: (!generating && !loading && hasData) ? 'pointer' : 'not-allowed',
                    opacity: (!hasData || loading) ? 0.4 : 1,
                    boxShadow: hasData ? `0 4px 14px ${rt.color}40` : 'none',
                  }}
                >
                  {generating === `${rt.id}-print` ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <FileDown size={14} />}
                  Open & Print PDF
                </button>
                <button
                  onClick={() => handleGenerate(rt.id, 'download')}
                  disabled={!!generating || loading || !hasData}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '11px 14px', borderRadius: 9, border: '1px solid #334155',
                    backgroundColor: c.bgInput, color: c.textSecondary, fontSize: 13, fontWeight: 600,
                    cursor: (!generating && !loading && hasData) ? 'pointer' : 'not-allowed',
                    opacity: (!hasData || loading) ? 0.4 : 1,
                  }}
                  title="Download as HTML"
                >
                  {generating === `${rt.id}-download` ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={13} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 10, backgroundColor: c.bgCard, border: `1px solid ${c.border}`, fontSize: 12, color: c.textSecondary, lineHeight: 1.6 }}>
        💡 <strong style={{ color: c.textSecondary }}>How to send to a client:</strong> Click "Open & Print PDF" → the report opens in a new tab → press Cmd/Ctrl+P → select "Save as PDF" → send the PDF. Reports include your brand name, reporting period, and all data with AI recommendations.
      </div>
    </PageShell>
  );
}


