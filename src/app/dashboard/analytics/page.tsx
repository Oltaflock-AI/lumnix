'use client';
import { useState } from 'react';
import { BarChart3, Users, Clock, MousePointer, ArrowUpRight, Download } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { DateRangePicker } from '@/components/DateRangePicker';

const sessionData = Array.from({ length: 14 }, (_, i) => ({
  day: `Mar ${i + 5}`,
  sessions: Math.floor(2200 + Math.random() * 800 + i * 50),
  users: Math.floor(1800 + Math.random() * 600 + i * 40),
}));

const sourceData = [
  { source: 'Google / Organic', sessions: 4820, pct: 42 },
  { source: 'Direct', sessions: 2140, pct: 19 },
  { source: 'Google / CPC', sessions: 1890, pct: 17 },
  { source: 'Facebook / Social', sessions: 1340, pct: 12 },
  { source: 'Email', sessions: 680, pct: 6 },
  { source: 'Referral', sessions: 430, pct: 4 },
];

const pageData = [
  { page: '/', views: 8420, avgTime: '1:42', bounce: '38%' },
  { page: '/pricing', views: 3210, avgTime: '2:18', bounce: '24%' },
  { page: '/ai-receptionist', views: 2840, avgTime: '3:05', bounce: '21%' },
  { page: '/blog/missed-calls', views: 1920, avgTime: '4:12', bounce: '45%' },
  { page: '/contact', views: 1640, avgTime: '1:08', bounce: '52%' },
];

function exportPagesCSV() {
  const headers = ['Page', 'Views', 'Avg Time', 'Bounce Rate'];
  const rows = pageData.map(p => [p.page, p.views, p.avgTime, p.bounce]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'krato-pages.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  return (
    <PageShell title="Web Analytics" description="Google Analytics 4 data & insights" icon={BarChart3}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <DateRangePicker value={days} onChange={setDays} />
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Sessions', value: '11,300', change: '+9.2%', icon: BarChart3, color: '#7c3aed' },
          { label: 'Users', value: '8,740', change: '+6.8%', icon: Users, color: '#3b82f6' },
          { label: 'Avg Duration', value: '2m 34s', change: '+12s', icon: Clock, color: '#22c55e' },
          { label: 'Conversions', value: '342', change: '+22.1%', icon: MousePointer, color: '#f59e0b' },
        ].map(kpi => (
          <div key={kpi.label} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <kpi.icon size={14} color={kpi.color} />
              <span style={{ fontSize: '12px', color: '#71717a' }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f4f4f5' }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <ArrowUpRight size={12} /> {kpi.change}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Sessions Chart */}
        <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5', marginBottom: '16px' }}>Sessions & Users</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={sessionData}>
              <defs>
                <linearGradient id="gSess" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity={0.2} /><stop offset="100%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#3f3f46" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis stroke="#3f3f46" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#f4f4f5', fontSize: '12px' }} />
              <Area type="monotone" dataKey="sessions" stroke="#7c3aed" fill="url(#gSess)" strokeWidth={2} />
              <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="none" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Traffic Sources */}
        <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5', marginBottom: '16px' }}>Traffic Sources</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sourceData.map(s => (
              <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ flex: 1, fontSize: '13px', color: '#a1a1aa' }}>{s.source}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5', width: '60px', textAlign: 'right' }}>{s.sessions.toLocaleString()}</span>
                <div style={{ width: '80px', height: '6px', borderRadius: '3px', backgroundColor: '#27272a', overflow: 'hidden' }}>
                  <div style={{ width: `${s.pct}%`, height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }} />
                </div>
                <span style={{ fontSize: '12px', color: '#52525b', width: '32px', textAlign: 'right' }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Pages */}
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '14px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5' }}>Top Pages</h2>
          <button onClick={exportPagesCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: '#a1a1aa', fontSize: '12px', cursor: 'pointer' }}>
            <Download size={12} /> Export CSV
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Page', 'Views', 'Avg Time', 'Bounce Rate'].map(h => (
              <th key={h} style={{ textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', paddingBottom: '10px', borderBottom: '1px solid #27272a' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {pageData.map(p => (
              <tr key={p.page} style={{ borderBottom: '1px solid #1e1e22' }}>
                <td style={{ padding: '10px 0', fontSize: '13px', color: '#a78bfa', fontWeight: 500 }}>{p.page}</td>
                <td style={{ padding: '10px 8px', fontSize: '13px', color: '#f4f4f5', fontWeight: 600 }}>{p.views.toLocaleString()}</td>
                <td style={{ padding: '10px 8px', fontSize: '13px', color: '#a1a1aa' }}>{p.avgTime}</td>
                <td style={{ padding: '10px 0', fontSize: '13px', color: parseFloat(p.bounce) > 40 ? '#ef4444' : '#a1a1aa' }}>{p.bounce}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
