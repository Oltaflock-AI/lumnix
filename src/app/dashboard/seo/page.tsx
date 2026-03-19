'use client';
import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, ArrowUpRight, Globe, FileText, AlertTriangle, Download } from 'lucide-react';
import { PageShell, EmptyState } from '@/components/PageShell';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { DateRangePicker } from '@/components/DateRangePicker';

const mockKeywords = [
  { keyword: 'ai automation agency', position: 3, change: 2, impressions: 12400, clicks: 890, ctr: 7.2 },
  { keyword: 'ai receptionist for law firms', position: 5, change: -1, impressions: 8200, clicks: 410, ctr: 5.0 },
  { keyword: 'missed call revenue leakage', position: 1, change: 0, impressions: 3400, clicks: 680, ctr: 20.0 },
  { keyword: 'n8n workflow automation', position: 12, change: 4, impressions: 18600, clicks: 320, ctr: 1.7 },
  { keyword: 'voice agent for business', position: 8, change: 3, impressions: 6800, clicks: 290, ctr: 4.3 },
  { keyword: 'whatsapp automation', position: 15, change: -3, impressions: 24000, clicks: 480, ctr: 2.0 },
  { keyword: 'real estate ai prospecting', position: 6, change: 1, impressions: 5400, clicks: 270, ctr: 5.0 },
];

const positionTrend = Array.from({ length: 14 }, (_, i) => ({
  day: `Mar ${i + 1}`,
  avgPosition: +(8.5 - i * 0.15 + Math.random() * 0.5).toFixed(1),
}));

function exportKeywordsCSV() {
  const headers = ['Keyword', 'Position', 'Change', 'Impressions', 'Clicks', 'CTR'];
  const rows = mockKeywords.map(kw => [kw.keyword, kw.position, kw.change, kw.impressions, kw.clicks, `${kw.ctr}%`]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'krato-keywords.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function SEOPage() {
  const [days, setDays] = useState(30);
  return (
    <PageShell title="SEO Intelligence" description="Google Search Console data & keyword tracking" icon={Search}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <DateRangePicker value={days} onChange={setDays} />
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Clicks', value: '3,340', change: '+14.2%', up: true },
          { label: 'Impressions', value: '78,800', change: '+8.7%', up: true },
          { label: 'Avg CTR', value: '4.24%', change: '+0.3%', up: true },
          { label: 'Avg Position', value: '7.2', change: '-1.4', up: true },
        ].map(kpi => (
          <div key={kpi.label} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '18px' }}>
            <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>{kpi.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f4f4f5' }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: kpi.up ? '#22c55e' : '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              {kpi.up ? <ArrowUpRight size={12} /> : null} {kpi.change}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', marginBottom: '24px' }}>
        {/* Keyword Table */}
        <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5' }}>Top Keywords</h2>
            <button onClick={exportKeywordsCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: '#a1a1aa', fontSize: '12px', cursor: 'pointer' }}>
              <Download size={12} /> Export CSV
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Keyword', 'Pos', 'Δ', 'Impr', 'Clicks', 'CTR'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: '10px', borderBottom: '1px solid #27272a' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {mockKeywords.map((kw, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e1e22' }}>
                  <td style={{ padding: '10px 0', fontSize: '13px', color: '#e4e4e7', fontWeight: 500, maxWidth: '220px' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kw.keyword}</div>
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: 600, color: kw.position <= 3 ? '#22c55e' : kw.position <= 10 ? '#f59e0b' : '#a1a1aa' }}>{kw.position}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px', color: kw.change > 0 ? '#22c55e' : kw.change < 0 ? '#ef4444' : '#52525b' }}>
                      {kw.change > 0 ? <TrendingUp size={12} /> : kw.change < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                      {Math.abs(kw.change)}
                    </div>
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: '13px', color: '#a1a1aa' }}>{kw.impressions.toLocaleString()}</td>
                  <td style={{ padding: '10px 8px', fontSize: '13px', color: '#a1a1aa' }}>{kw.clicks.toLocaleString()}</td>
                  <td style={{ padding: '10px 0', fontSize: '13px', color: '#a1a1aa' }}>{kw.ctr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Position Trend */}
        <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5', marginBottom: '4px' }}>Avg Position Trend</h2>
          <p style={{ fontSize: '13px', color: '#71717a', marginBottom: '16px' }}>Lower is better</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={positionTrend}>
              <defs><linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity={0.2} /><stop offset="100%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="day" stroke="#3f3f46" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis reversed stroke="#3f3f46" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#f4f4f5', fontSize: '12px' }} />
              <Area type="monotone" dataKey="avgPosition" stroke="#7c3aed" fill="url(#gPos)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>

          {/* CTR Gaps */}
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5', marginTop: '20px', marginBottom: '10px' }}>CTR Gap Opportunities</h3>
          {[
            { page: '/ai-receptionist', ctr: 2.1, expected: 8.5 },
            { page: '/pricing', ctr: 3.4, expected: 7.2 },
          ].map(gap => (
            <div key={gap.page} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #1e1e22' }}>
              <AlertTriangle size={14} color="#f59e0b" />
              <span style={{ flex: 1, fontSize: '12px', color: '#a1a1aa' }}>{gap.page}</span>
              <span style={{ fontSize: '12px', color: '#ef4444' }}>{gap.ctr}%</span>
              <span style={{ fontSize: '12px', color: '#52525b' }}>→</span>
              <span style={{ fontSize: '12px', color: '#22c55e' }}>{gap.expected}%</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
